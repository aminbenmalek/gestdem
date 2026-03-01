import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Supplier } from "../../types";
import { storageService } from "../../services/storageService";
import { apiService } from "../../services/apiService";

interface SuppliersState {
  list: Supplier[];
}

const initialState: SuppliersState = {
  list: storageService.getSuppliers(),
};

const suppliersSlice = createSlice({
  name: "suppliers",
  initialState,
  reducers: {
    setSuppliers: (state, action: PayloadAction<Supplier[]>) => {
      state.list = action.payload;
    },
    addOrUpdateSupplier: (state, action: PayloadAction<Supplier>) => {
      const index = state.list.findIndex((s) => s.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
    },
    removeSupplier: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((s) => s.id !== action.payload);
    },
    refreshSuppliers: (state) => {
      state.list = storageService.getSuppliers();
    },
  },
});

export const {
  setSuppliers,
  addOrUpdateSupplier,
  removeSupplier,
  refreshSuppliers,
} = suppliersSlice.actions;
export default suppliersSlice.reducer;

export const saveSupplier = (supplier: Supplier) => async (dispatch: any) => {
  try {
    let resp: any;
    if (supplier && supplier.id)
      resp = await apiService
        .put(`/suppliers/${supplier.id}`, supplier)
        .catch(() => null);
    if (!resp)
      resp = await apiService
        .post("/suppliers", supplier)
        .catch(() => supplier);
    const toStore = resp || supplier;
    storageService.saveSupplier(toStore);
    dispatch(addOrUpdateSupplier(toStore));
    return toStore;
  } catch (err) {
    storageService.saveSupplier(supplier);
    dispatch(addOrUpdateSupplier(supplier));
    throw err;
  }
};

export const deleteSupplierAsync = (id: string) => async (dispatch: any) => {
  try {
    await apiService.delete(`/suppliers/${id}`).catch(() => null);
    storageService.deleteSupplier(id);
    dispatch(removeSupplier(id));
    return true;
  } catch (err) {
    throw err;
  }
};
