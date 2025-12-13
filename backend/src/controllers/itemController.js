const Item = require('../models/Item');

exports.createItem = async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'Title required' });
  const item = await Item.create({ title, description, owner: req.user.id });
  res.status(201).json(item);
};

exports.getItems = async (req, res) => {
  const items = await Item.find({ owner: req.user.id });
  res.json(items);
};

exports.getItem = async (req, res) => {
  const item = await Item.findOne({ _id: req.params.id, owner: req.user.id });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

exports.updateItem = async (req, res) => {
  const item = await Item.findOneAndUpdate(
    { _id: req.params.id, owner: req.user.id },
    req.body,
    { new: true }
  );
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json(item);
};

exports.deleteItem = async (req, res) => {
  const item = await Item.findOneAndDelete({ _id: req.params.id, owner: req.user.id });
  if (!item) return res.status(404).json({ message: 'Not found' });
  res.json({ message: 'Deleted' });
};
