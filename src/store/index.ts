import { configureStore } from "@reduxjs/toolkit";
import ordersReducer from "./ordersSlice";
import stockReducer from "./stockSlice";
import catalogReducer from "./catalogSlice";
import centresReducer from "./centresSlice";
import suppliersReducer from "./suppliersSlice";
import fleetReducer from "./fleetSlice";

export const store = configureStore({
  reducer: {
    orders: ordersReducer,
    stock: stockReducer,
    catalog: catalogReducer,
    centres: centresReducer,
    suppliers: suppliersReducer,
    fleet: fleetReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
