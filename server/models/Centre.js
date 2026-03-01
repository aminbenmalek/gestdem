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

const CentreSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String },
    history: { type: [HistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Centre", CentreSchema);
