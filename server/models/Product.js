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

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    code: { type: String },
    label: { type: String },
    defaultUnitPrice: { type: Number, default: 0 },
    defaultTaxRate: { type: Number, default: 0 },
    applyFodec: { type: Boolean, default: false },
    minStockLevel: { type: Number },
    history: { type: [HistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Product", ProductSchema);
