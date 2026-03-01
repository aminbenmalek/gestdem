import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { StockMovement } from "../../types";
import { storageService } from "../../services/storageService";
import { apiService } from "../../services/apiService";

interface StockState {
  movements: StockMovement[];
}

const initialState: StockState = {
  movements: storageService.getStockMovements(),
};

const stockSlice = createSlice({
  name: "stock",
  initialState,
  reducers: {
    setMovements: (state, action: PayloadAction<StockMovement[]>) => {
      state.movements = action.payload;
    },
    addMovement: (state, action: PayloadAction<StockMovement>) => {
      state.movements.push(action.payload);
    },
    removeMovement: (state, action: PayloadAction<string>) => {
      state.movements = state.movements.filter((m) => m.id !== action.payload);
    },
    refreshMovements: (state) => {
      state.movements = storageService.getStockMovements();
    },
  },
});

export const { setMovements, addMovement, removeMovement, refreshMovements } =
  stockSlice.actions;
export default stockSlice.reducer;

export const saveMovement = (mvt: StockMovement) => async (dispatch: any) => {
  try {
    const resp = await apiService.post("/stock", mvt).catch(() => mvt);
    const toStore = resp || mvt;
    storageService.saveStockMovement(toStore);
    dispatch(addMovement(toStore));
    return toStore;
  } catch (err) {
    storageService.saveStockMovement(mvt);
    dispatch(addMovement(mvt));
    throw err;
  }
};

export const deleteMovementAsync = (id: string) => async (dispatch: any) => {
  try {
    await apiService.delete(`/stock/${id}`).catch(() => null);
    storageService.deleteStockMovement(id);
    dispatch(removeMovement(id));
    return true;
  } catch (err) {
    throw err;
  }
};
