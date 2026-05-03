const { Team } = require('../models/teamModel');
const { authenticate } = require('../middlewares/auth');
const { buildController, buildRouter } = require('../services/crudFactory');

const controller = buildController({
  Model: Team,
  resourceName: 'Team',
  searchKeys: ['name', 'code'],
  allowedSort: ['createdAt', 'updatedAt', 'name', 'is_active'],
});

module.exports = buildRouter(controller, { authenticate });
