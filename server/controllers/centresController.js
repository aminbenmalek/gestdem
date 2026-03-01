const Centre = require("../models/Centre");

exports.list = async (req, res) => {
  try {
    const centres = await Centre.find().lean();
    res.json(centres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const centre = await Centre.findOne({ id: req.params.id }).lean();
    if (!centre) return res.status(404).json({ error: "Not found" });
    res.json(centre);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const data = req.body;
    const centre = new Centre(data);
    await centre.save();
    res.status(201).json(centre);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Centre.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const removed = await Centre.findOneAndDelete({ id: req.params.id });
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
