const superAdminMenuConfig = [
  {
    key: "analytics",
    name: "Analytics",
    route: "/analytics",
    icon: "analytics",
    module: "Analytics"
  },
  {
    key: "organization.list",
    name: "Organizations",
    route: "/organization/list",
    icon: "organization",
    module: "Organization"
  },
  {
    key: "organization.adminRoles",
    name: "Admin Roles",
    route: "/organization/admin-roles",
    icon: "shield",
    module: "Organization"
  },
  {
    key: "users.list",
    name: "Users List",
    route: "/users",
    icon: "users",
    module: "Users"
  },
  {
    key: "users.roles",
    name: "Roles & Permissions",
    route: "/users/roles",
    icon: "shield",
    module: "Users"
  },
  {
    key: "leads.contacts",
    name: "Contacts List",
    route: "/leads/contacts",
    icon: "contact",
    module: "Leads"
  },
  {
    key: "leads.tasks",
    name: "Tasks List",
    route: "/leads/tasks",
    icon: "tasks",
    module: "Leads"
  },
  {
    key: "leads.callLogs",
    name: "Call Logs List",
    route: "/leads/call-logs",
    icon: "call",
    module: "Leads"
  },
  {
    key: "leads.bookings",
    name: "Bookings List",
    route: "/leads/bookings",
    icon: "booking",
    module: "Leads"
  },
  {
    key: "leads.sorted",
    name: "Sorted list",
    route: "/leads/sorted",
    icon: "sort",
    module: "Leads"
  },
  {
    key: "configuration.industries",
    name: "Industries",
    route: "/configuration/industries",
    icon: "organization",
    module: "Configuration"
  },
  {
    key: "configuration.menus",
    name: "Sidebar Menus",
    route: "/configuration/menus",
    icon: "sidebar",
    module: "Configuration"
  },
  {
    key: "configuration.permissions",
    name: "Permissions Matrix",
    route: "/configuration/permissions",
    icon: "settings",
    module: "Configuration"
  },
  {
    key: "configuration.screens",
    name: "Screens",
    route: "/configuration/screens",
    icon: "headers",
    module: "Configuration"
  },
  {
    key: "configuration.screenFields",
    name: "Screen Fields",
    route: "/configuration/screen-fields",
    icon: "headers",
    module: "Configuration"
  },
  {
    key: "configuration.screenPermissions",
    name: "Screen Permissions",
    route: "/configuration/screen-permissions",
    icon: "headers",
    module: "Configuration"
  },
  {
    key: "configuration.projects",
    name: "Projects List",
    route: "/configuration/projects",
    icon: "projects",
    module: "Configuration"
  },
  {
    key: "configuration.api",
    name: "API List",
    route: "/configuration/api",
    icon: "api",
    module: "Configuration"
  },
  {
    key: "configuration.bookingForm",
    name: "Booking Form",
    route: "/configuration/booking-form",
    icon: "booking",
    module: "Configuration"
  },
  {
    key: "configuration.resources",
    name: "Resources",
    route: "/configuration/resources",
    icon: "resources",
    module: "Configuration"
  },
  {
    key: "configuration.whatsapp",
    name: "Whatsapp API",
    route: "/configuration/whatsapp",
    icon: "whatsapp",
    module: "Configuration"
  },
  {
    key: "support.news",
    name: "News List",
    route: "/support/news",
    icon: "news",
    module: "Support"
  },
  {
    key: "support.faq",
    name: "FAQ List",
    route: "/support/faq",
    icon: "faq",
    module: "Support"
  },
  {
    key: "account.licenses",
    name: "Licenses Cost",
    route: "/account/licenses",
    icon: "billing",
    module: "Account"
  },
  {
    key: "account.coupons",
    name: "Coupon",
    route: "/account/coupons",
    icon: "coupon",
    module: "Account"
  },
  {
    key: "account.password",
    name: "Update Password",
    route: "/account/update-password",
    icon: "password",
    module: "Account"
  }
];

function mapApiMenusToNavItems(raw) {
  if (!raw || !raw.length) return [];
  const groups = new Map();
  raw.forEach((item) => {
    const mod = (item.module ?? item.key).toLowerCase();
    if (!groups.has(mod)) groups.set(mod, { parent: null, children: [] });
    const g = groups.get(mod);
    if (item.key.includes('.')) {
      g.children.push(item);
    } else {
      g.parent = item;
    }
  });
  const result = [];
  groups.forEach((g, mod) => {
    const { parent, children } = g;
    if (children.length === 0) {
      if (parent) {
        result.push({
          id: parent.key,
          name: parent.name,
          route: parent.route,
          icon: parent.icon,
          module: mod,
        });
      }
    } else {
      const childItems = children.map((c) => ({
        id: c.key,
        name: c.name,
        route: c.route ?? '#',
        icon: c.icon,
      }));
      result.push({
        id: parent?.key ?? mod,
        name: parent?.name ?? (mod.charAt(0).toUpperCase() + mod.slice(1)),
        icon: parent?.icon ?? mod,
        route: parent?.route,
        module: mod,
        children: childItems,
      });
    }
  });
  return result;
}

console.log(JSON.stringify(mapApiMenusToNavItems(superAdminMenuConfig), null, 2));
