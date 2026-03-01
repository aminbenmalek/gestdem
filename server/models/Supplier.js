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

const SupplierSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String },
    address: { type: String },
    category: { type: String },
    taxId: { type: String },
    phone: { type: String },
    history: { type: [HistoryEntrySchema], default: [] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Supplier", SupplierSchema);
