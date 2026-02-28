
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Supplier } from '../../types';
import { storageService } from '../../services/storageService';

interface SuppliersState {
  list: Supplier[];
}

const initialState: SuppliersState = {
  list: storageService.getSuppliers(),
};

const suppliersSlice = createSlice({
  name: 'suppliers',
  initialState,
  reducers: {
    setSuppliers: (state, action: PayloadAction<Supplier[]>) => {
      state.list = action.payload;
    },
    addOrUpdateSupplier: (state, action: PayloadAction<Supplier>) => {
      const index = state.list.findIndex(s => s.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
      storageService.saveSupplier(action.payload);
    },
    removeSupplier: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(s => s.id !== action.payload);
      storageService.deleteSupplier(action.payload);
    },
    refreshSuppliers: (state) => {
      state.list = storageService.getSuppliers();
    },
  },
});

export const { setSuppliers, addOrUpdateSupplier, removeSupplier, refreshSuppliers } = suppliersSlice.actions;
export default suppliersSlice.reducer;
