const mongoose = require("mongoose");

const CarburantSchema = new mongoose.Schema(
  {
    id: { type: String },
    vehicleId: { type: String },
    date: { type: String },
    quantity: { type: Number },
    cost: { type: Number },
    mileageAtFueling: { type: Number },
    driver: { type: String },
    destination: { type: String },
    reason: { type: String },
    referenceNumber: { type: String },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Carburant", CarburantSchema);
