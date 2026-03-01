import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Order } from "../../types";
import { storageService } from "../../services/storageService";
import { apiService } from "../../services/apiService";

interface OrdersState {
  list: Order[];
}

const initialState: OrdersState = {
  list: storageService.getOrders(),
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setOrders: (state, action: PayloadAction<Order[]>) => {
      state.list = action.payload;
    },
    addOrUpdateOrder: (state, action: PayloadAction<Order>) => {
      const index = state.list.findIndex((o) => o.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
    },
    removeOrder: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((o) => o.id !== action.payload);
    },
  },
});

export const { setOrders, addOrUpdateOrder, removeOrder } = ordersSlice.actions;
export default ordersSlice.reducer;

// Thunks
export const saveOrder = (order: Order) => async (dispatch: any) => {
  try {
    let serverResp: any;
    if (order && order.id) {
      serverResp = await apiService
        .put(`/orders/${order.id}`, order)
        .catch(() => null);
    }
    if (!serverResp) {
      serverResp = await apiService.post("/orders", order).catch(() => order);
    }

    const toStore = serverResp || order;
    storageService.saveOrder(toStore);
    dispatch(addOrUpdateOrder(toStore));
    return toStore;
  } catch (err) {
    // still persist locally as fallback
    storageService.saveOrder(order);
    dispatch(addOrUpdateOrder(order));
    throw err;
  }
};

export const deleteOrderAsync = (id: string) => async (dispatch: any) => {
  try {
    await apiService.delete(`/orders/${id}`).catch(() => null);
    storageService.deleteOrder(id);
    dispatch(removeOrder(id));
    return true;
  } catch (err) {
    throw err;
  }
};
