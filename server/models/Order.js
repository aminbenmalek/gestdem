const mongoose = require("mongoose");

const OrderItemSchema = new mongoose.Schema(
  {
    id: { type: String },
    productId: { type: String },
    description: { type: String },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    fodecRate: { type: Number, default: 0 },
    applyFodec: { type: Boolean, default: false },
  },
  { _id: false },
);

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    orderNumber: { type: String },
    date: { type: String },
    supplierId: { type: String },
    centreId: { type: String },
    status: { type: String },
    items: { type: [OrderItemSchema], default: [] },
    notes: { type: String },
    totalHT: { type: Number, default: 0 },
    totalFodec: { type: Number, default: 0 },
    totalTVA: { type: Number, default: 0 },
    totalTTC: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Order", OrderSchema);
