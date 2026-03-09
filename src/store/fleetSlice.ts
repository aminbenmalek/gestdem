import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Vehicle, MaintenanceRecord, FuelRecord, Driver } from "../../types";
import { storageService } from "../../services/storageService";

interface FleetState {
  vehicles: Vehicle[];
  maintenance: MaintenanceRecord[];
  fuel: FuelRecord[];
  drivers: Driver[];
}

const initialState: FleetState = {
  vehicles: storageService.getVehicles(),
  maintenance: storageService.getMaintenanceRecords(),
  fuel: storageService.getFuelRecords(),
  drivers: storageService.getDrivers(),
};

const fleetSlice = createSlice({
  name: "fleet",
  initialState,
  reducers: {
    addOrUpdateVehicle: (state, action: PayloadAction<Vehicle>) => {
      const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
      if (index >= 0) {
        state.vehicles[index] = action.payload;
      } else {
        state.vehicles.push(action.payload);
      }
      storageService.saveVehicle(action.payload);
    },
    removeVehicle: (state, action: PayloadAction<string>) => {
      state.vehicles = state.vehicles.filter((v) => v.id !== action.payload);
      storageService.deleteVehicle(action.payload);
    },
    addMaintenanceRecord: (state, action: PayloadAction<MaintenanceRecord>) => {
      state.maintenance.push(action.payload);
      storageService.saveMaintenanceRecord(action.payload);

      // Update vehicle mileage and last maintenance date if needed
      const vehicle = state.vehicles.find(
        (v) => v.id === action.payload.vehicleId,
      );
      if (vehicle) {
        if (
          new Date(action.payload.date) > new Date(vehicle.lastMaintenanceDate)
        ) {
          vehicle.lastMaintenanceDate = action.payload.date;
        }
        if (action.payload.mileageAtMaintenance > vehicle.currentMileage) {
          vehicle.currentMileage = action.payload.mileageAtMaintenance;
        }
        storageService.saveVehicle(vehicle);
      }
    },
    addFuelRecord: (state, action: PayloadAction<FuelRecord>) => {
      state.fuel.push(action.payload);
      storageService.saveFuelRecord(action.payload);

      // Update vehicle mileage
      const vehicle = state.vehicles.find(
        (v) => v.id === action.payload.vehicleId,
      );
      if (vehicle && action.payload.mileageAtFueling > vehicle.currentMileage) {
        vehicle.currentMileage = action.payload.mileageAtFueling;
        storageService.saveVehicle(vehicle);
      }
    },
    refreshFleet: (state) => {
      state.vehicles = storageService.getVehicles();
      state.maintenance = storageService.getMaintenanceRecords();
      state.fuel = storageService.getFuelRecords();
      state.drivers = storageService.getDrivers();
    },
    addOrUpdateDriver: (state, action: PayloadAction<Driver>) => {
      const index = state.drivers.findIndex((d) => d.id === action.payload.id);
      if (index >= 0) {
        state.drivers[index] = action.payload;
      } else {
        state.drivers.push(action.payload);
      }
      storageService.saveDriver(action.payload);
    },
    removeDriver: (state, action: PayloadAction<string>) => {
      state.drivers = state.drivers.filter((d) => d.id !== action.payload);
      storageService.deleteDriver(action.payload);

      // Unassign from vehicles
      state.vehicles.forEach((v) => {
        if (v.driverId === action.payload) {
          v.driverId = undefined;
          storageService.saveVehicle(v);
        }
      });
    },
  },
});

export const {
  addOrUpdateVehicle,
  removeVehicle,
  addMaintenanceRecord,
  addFuelRecord,
  refreshFleet,
  addOrUpdateDriver,
  removeDriver,
} = fleetSlice.actions;
export default fleetSlice.reducer;
