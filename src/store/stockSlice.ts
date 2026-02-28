
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StockMovement } from '../../types';
import { storageService } from '../../services/storageService';

interface StockState {
  movements: StockMovement[];
}

const initialState: StockState = {
  movements: storageService.getStockMovements(),
};

const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setMovements: (state, action: PayloadAction<StockMovement[]>) => {
      state.movements = action.payload;
    },
    addMovement: (state, action: PayloadAction<StockMovement>) => {
      state.movements.push(action.payload);
      storageService.saveStockMovement(action.payload);
    },
    removeMovement: (state, action: PayloadAction<string>) => {
      state.movements = state.movements.filter(m => m.id !== action.payload);
      storageService.deleteStockMovement(action.payload);
    },
    refreshMovements: (state) => {
      state.movements = storageService.getStockMovements();
    }
  },
});

export const { setMovements, addMovement, removeMovement, refreshMovements } = stockSlice.actions;
export default stockSlice.reducer;
