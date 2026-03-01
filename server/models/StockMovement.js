const mongoose = require("mongoose");

const StockMovementItemSchema = new mongoose.Schema(
  {
    productId: { type: String },
    label: { type: String },
    quantity: { type: Number, default: 0 },
  },
  { _id: false },
);

const StockMovementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    reference: { type: String },
    date: { type: String },
    sourceCentreId: { type: String },
    destinationCentreId: { type: String },
    items: { type: [StockMovementItemSchema], default: [] },
    notes: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("StockMovement", StockMovementSchema);
