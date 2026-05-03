const service = require('../services/contactService');

exports.list = async (req, res, next) => {
  try {
    const items = await service.listForUser({
      authedUser: req.user,
      limit: Number(req.query.limit) || 200,
    });
    res.json({ items });
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const item = await service.createForUser({
      payload: req.body,
      authedUser: req.user,
    });
    res.status(201).json(item);
  } catch (err) {
    next(err);
  }
};
