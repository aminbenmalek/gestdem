
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';
import { storageService } from '../../services/storageService';

interface CatalogState {
  products: Product[];
}

const initialState: CatalogState = {
  products: storageService.getProducts(),
};

const catalogSlice = createSlice({
  name: 'catalog',
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addOrUpdateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index >= 0) {
        state.products[index] = action.payload;
      } else {
        state.products.push(action.payload);
      }
      storageService.saveProduct(action.payload);
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter(p => p.id !== action.payload);
      storageService.deleteProduct(action.payload);
    },
  },
});

export const { setProducts, addOrUpdateProduct, removeProduct } = catalogSlice.actions;
export default catalogSlice.reducer;
