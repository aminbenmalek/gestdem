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

const VehiculeSchema = new mongoose.Schema(
  {
    id: { type: String },
    registration: { type: String },
    brand: { type: String },
    model: { type: String },
    year: { type: Number },
    fuelType: { type: String },
    currentMileage: { type: Number },
    status: { type: String },
    assignment: { type: String },
    driverId: { type: String },
    insuranceExpiry: { type: String },
    lastMaintenanceDate: { type: String },
    nextMaintenanceMileage: { type: Number },
    history: { type: [HistoryEntrySchema] },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Vehicule", VehiculeSchema);
