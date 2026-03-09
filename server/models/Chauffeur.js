const mongoose = require("mongoose");

const HistoryEntrySchema = new mongoose.Schema(
  {
    id: { type: String },
    date: { type: String },
    user: { type: String },
    action: { type: String },
    changes: { type: String },
  },
  { _id: false },
);

const ChauffeurSchema = new mongoose.Schema(
  {
    id: { type: String },
    name: { type: String },
    licenseNumber: { type: String },
    phone: { type: String },
    status: { type: String },
    history: { type: [HistoryEntrySchema] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Chauffeur", ChauffeurSchema);
