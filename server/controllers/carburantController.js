const Carburant = require("../models/Carburant");
exports.list = async (req, res) => {
  try {
    const items = await Carburant.find().lean();
    if (items.length != 0) {
      res.json(items);
    } else {
      res.status(404).json({ message: "Pas des Carburants enregistrés!" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.get = async (req, res) => {
  try {
    const item = await Carburant.findOne({ id: req.params.id }).lean();
    if (!item) return res.status(404).json({ error: "Carburant non trouvé!" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const obj = new Carburant(req.body);
    await obj.save();
    res.status(201).json(obj);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const updated = await Carburant.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true },
    );
    if (!updated)
      return res.status(404).json({ error: "Carburant non trouvé!" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const removed = await Carburant.findOneAndDelete({ id: req.params.id });
    if (!removed)
      return res.status(404).json({ error: "Carburant non trouvé!" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
