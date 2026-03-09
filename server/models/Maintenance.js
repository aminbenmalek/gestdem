const mongoose = require("mongoose");

const MaintenanceSchema = new mongoose.Schema(
  {
    id: { type: String },
    vehicleId: { type: String },
    date: { type: String },
    type: { type: String },
    cost: { type: Number },
    description: { type: String },
    mileageAtMaintenance: { type: Number },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Maintenance", MaintenanceSchema);
