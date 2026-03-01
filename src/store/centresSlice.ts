import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Centre } from "../../types";
import { storageService } from "../../services/storageService";
import { apiService } from "../../services/apiService";

interface CentresState {
  list: Centre[];
}

const initialState: CentresState = {
  list: storageService.getCentres(),
};

const centresSlice = createSlice({
  name: "centres",
  initialState,
  reducers: {
    setCentres: (state, action: PayloadAction<Centre[]>) => {
      state.list = action.payload;
    },
    addOrUpdateCentre: (state, action: PayloadAction<Centre>) => {
      const index = state.list.findIndex((c) => c.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
    },
    removeCentre: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter((c) => c.id !== action.payload);
    },
    refreshCentres: (state) => {
      state.list = storageService.getCentres();
    },
  },
});

export const { setCentres, addOrUpdateCentre, removeCentre, refreshCentres } =
  centresSlice.actions;
export default centresSlice.reducer;

export const saveCentre = (centre: Centre) => async (dispatch: any) => {
  try {
    let resp: any;
    if (centre && centre.id)
      resp = await apiService
        .put(`/centres/${centre.id}`, centre)
        .catch(() => null);
    if (!resp)
      resp = await apiService.post("/centres", centre).catch(() => centre);
    const toStore = resp || centre;
    storageService.saveCentre(toStore);
    dispatch(addOrUpdateCentre(toStore));
    return toStore;
  } catch (err) {
    storageService.saveCentre(centre);
    dispatch(addOrUpdateCentre(centre));
    throw err;
  }
};

export const deleteCentreAsync = (id: string) => async (dispatch: any) => {
  try {
    await apiService.delete(`/centres/${id}`).catch(() => null);
    storageService.deleteCentre(id);
    dispatch(removeCentre(id));
    return true;
  } catch (err) {
    throw err;
  }
};
