
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Centre } from '../../types';
import { storageService } from '../../services/storageService';

interface CentresState {
  list: Centre[];
}

const initialState: CentresState = {
  list: storageService.getCentres(),
};

const centresSlice = createSlice({
  name: 'centres',
  initialState,
  reducers: {
    setCentres: (state, action: PayloadAction<Centre[]>) => {
      state.list = action.payload;
    },
    addOrUpdateCentre: (state, action: PayloadAction<Centre>) => {
      const index = state.list.findIndex(c => c.id === action.payload.id);
      if (index >= 0) {
        state.list[index] = action.payload;
      } else {
        state.list.push(action.payload);
      }
      storageService.saveCentre(action.payload);
    },
    removeCentre: (state, action: PayloadAction<string>) => {
      state.list = state.list.filter(c => c.id !== action.payload);
      storageService.deleteCentre(action.payload);
    },
    refreshCentres: (state) => {
      state.list = storageService.getCentres();
    },
  },
});

export const { setCentres, addOrUpdateCentre, removeCentre, refreshCentres } = centresSlice.actions;
export default centresSlice.reducer;
