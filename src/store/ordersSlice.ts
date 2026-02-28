
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../../types';
import { storageService } from '../../services/storageService';

interface OrdersState {
  list: Order[];
}

const initialState: OrdersState = {
  list: storageService.getOrders(),
};

const ordersSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.list = action.payload;
    },
    addOrUpdateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.list.findIndex(o => o.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
      storageService.saveOrder(action.payload);
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(o => o.id !== action.payload);
      storageService.deleteOrder(action.payload);
    },
  },
});

export const { setOrders, addOrUpdateOrder, removeOrder } = ordersSlice.actions;
export default ordersSlice.reducer;
