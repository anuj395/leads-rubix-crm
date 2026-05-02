// src/services/sidebarService.js
// New normalized sidebar resolver — composes a user's menus from the
// industries / roles / sidebar_menus / sidebar_permissions collections.
const industryModel = require('../models/industryModel');
const roleModel = require('../models/roleModel');
const menuModel = require('../models/sidebarMenuModel');
const permModel = require('../models/sidebarPermissionModel');

/**
 * Resolves the sidebar for a (industry_code, role_key) pair.
 * Returns { industry_id, industry_code, role, menus } where `menus` is a
 * flat array; each item carries `parent_id` so the client can build a tree.
 */
async function resolveSidebar({ industry_code, role_key }) {
  if (!industry_code || !role_key) {
    return { industry_code, role: role_key, menus: [] };
  }

  const industry = await industryModel.findByCode(industry_code);
  if (!industry || industry.is_active === false) {
    return { industry_code, role: role_key, menus: [] };
  }

  const role = await roleModel.findByIndustryAndKey(industry._id, role_key);
  if (!role || role.is_active === false) {
    return {
      industry_id: String(industry._id),
      industry_code,
      role: role_key,
      menus: [],
    };
  }

  const perms = await permModel.list({
    role_id: role._id,
    industry_id: industry._id,
    visibleOnly: true,
  });
  if (!perms.length) {
    return {
      industry_id: String(industry._id),
      industry_code,
      role: role_key,
      menus: [],
    };
  }

  const menus = await menuModel.findByIds(perms.map((p) => p.menu_id));
  const menuById = new Map(
    menus.filter((m) => m.is_active !== false).map((m) => [String(m._id), m]),
  );

  // Ensure all parents referenced by visible children are included so
  // hierarchy renders correctly even if no explicit permission exists for
  // the parent menu itself.
  const includedIds = new Set([...menuById.keys()]);
  const parentIdsToFetch = [];
  for (const m of menuById.values()) {
    if (m.parent_id && !includedIds.has(String(m.parent_id))) {
      parentIdsToFetch.push(m.parent_id);
      includedIds.add(String(m.parent_id));
    }
  }
  if (parentIdsToFetch.length) {
    const parents = await menuModel.findByIds(parentIdsToFetch);
    for (const p of parents) {
      if (p.is_active !== false) menuById.set(String(p._id), p);
    }
  }

  const permByMenu = new Map(perms.map((p) => [String(p.menu_id), p]));

  const items = [...menuById.values()]
    .map((m) => {
      const perm = permByMenu.get(String(m._id));
      const order =
        perm && typeof perm.order_override === 'number'
          ? perm.order_override
          : typeof m.order === 'number'
            ? m.order
            : 0;
      return {
        _id: String(m._id),
        key: m.key,
        name: m.name,
        icon: m.icon || '',
        route: m.route || '',
        parent_id: m.parent_id ? String(m.parent_id) : null,
        order,
        module: m.module || '',
      };
    })
    .sort((a, b) => a.order - b.order);

  return {
    industry_id: String(industry._id),
    industry_code,
    role: role_key,
    menus: items,
  };
}

exports.resolveSidebar = resolveSidebar;

// ── Legacy compatibility helpers ─────────────────────────────────────────────

/**
 * Legacy: returns the list of menus for (industry_code, role_key) in the same
 * flat shape the existing frontend expects from POST /sidebar/user.
 */
exports.getRoleMenus = async (industry_code, role_key) => {
  if (!industry_code || !role_key) {
    const err = new Error('industry_id and role are required');
    err.status = 400;
    throw err;
  }
  const result = await resolveSidebar({ industry_code, role_key });
  return result.menus;
};

/**
 * Legacy: returns full sidebar grouped by role for an industry, mimicking
 * the old sidebar_configs document shape.
 */
exports.getByIndustry = async (industry_code) => {
  if (!industry_code) {
    const err = new Error('industry_id is required');
    err.status = 400;
    throw err;
  }
  const industry = await industryModel.findByCode(industry_code);
  if (!industry) return null;

  const [roles, menus, perms] = await Promise.all([
    roleModel.list({ industry_id: industry._id }),
    menuModel.list(),
    permModel.list({ industry_id: industry._id, visibleOnly: true }),
  ]);

  const menuById = new Map(menus.map((m) => [String(m._id), m]));
  const rolesObj = {};
  for (const r of roles) rolesObj[r.key] = [];

  const grouped = new Map();
  for (const p of perms) {
    const key = String(p.role_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(p);
  }

  for (const r of roles) {
    const list = grouped.get(String(r._id)) || [];
    list.sort((a, b) => {
      const aMenu = menuById.get(String(a.menu_id));
      const bMenu = menuById.get(String(b.menu_id));
      const aOrder =
        typeof a.order_override === 'number'
          ? a.order_override
          : aMenu?.order ?? 0;
      const bOrder =
        typeof b.order_override === 'number'
          ? b.order_override
          : bMenu?.order ?? 0;
      return aOrder - bOrder;
    });
    rolesObj[r.key] = list
      .map((p) => menuById.get(String(p.menu_id)))
      .filter((m) => m && m.is_active !== false)
      .map((m) => ({
        key: m.key,
        name: m.name,
        route: m.route || '',
        icon: m.icon || '',
        module: m.module || '',
      }));
  }

  return {
    industry_id: industry.code,
    is_ready_to_launch: !!industry.is_active,
    roles: rolesObj,
  };
};

/**
 * Legacy upsert — accepts {industry_id (= code), role, menus[]} and writes
 * to the new normalized tables. Used by the old SidebarConfig page until it
 * migrates to the new permission-matrix UI.
 */
exports.upsertRole = async ({ industry_id, role, menus }) => {
  if (!industry_id || !role) {
    const err = new Error('industry_id and role are required');
    err.status = 400;
    throw err;
  }
  const arr = Array.isArray(menus) ? menus : [];

  // upsert industry by code
  let industry = await industryModel.findByCode(industry_id);
  if (!industry) {
    industry = await industryModel.create({
      code: industry_id,
      name: industry_id,
    });
  }

  // upsert role within that industry
  let roleDoc = await roleModel.findByIndustryAndKey(industry._id, role);
  if (!roleDoc) {
    roleDoc = await roleModel.create({
      industry_id: industry._id,
      key: role,
      name: role,
    });
  }

  // upsert menus (master catalog) and collect ids
  const menuIds = [];
  for (let i = 0; i < arr.length; i++) {
    const m = arr[i];
    if (!m || !m.key || !m.name) continue;
    const isChild = String(m.key).includes('.');
    const moduleKey = (m.module || (isChild ? m.key.split('.')[0] : m.key)).toLowerCase();

    let parentId = null;
    if (isChild) {
      const parent = await menuModel.upsertByKey(moduleKey, {
        name: moduleKey.charAt(0).toUpperCase() + moduleKey.slice(1),
        icon: moduleKey,
        module: moduleKey,
      });
      parentId = parent._id;
    }

    const menu = await menuModel.upsertByKey(m.key, {
      name: m.name,
      icon: m.icon || '',
      route: m.route || '',
      parent_id: parentId,
      module: moduleKey,
      order: i,
    });
    menuIds.push(menu._id);
  }

  // bulk-set permissions for this role+industry
  await permModel.bulkSetForRoleIndustry({
    role_id: roleDoc._id,
    industry_id: industry._id,
    menu_ids: menuIds,
  });

  // return legacy-shaped doc
  const full = await exports.getByIndustry(industry.code);
  return {
    industry_id: industry.code,
    roles: full?.roles || {},
    is_ready_to_launch: !!industry.is_active,
    created: false,
    fullDocument: full,
  };
};
