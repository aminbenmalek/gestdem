import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Product } from "../../types";
import { storageService } from "../../services/storageService";
import { apiService } from "../../services/apiService";

interface CatalogState {
  products: Product[];
}

const initialState: CatalogState = {
  products: storageService.getProducts(),
};

const catalogSlice = createSlice({
  name: "catalog",
  initialState,
  reducers: {
    setProducts: (state, action: PayloadAction<Product[]>) => {
      state.products = action.payload;
    },
    addOrUpdateProduct: (state, action: PayloadAction<Product>) => {
      const index = state.products.findIndex((p) => p.id === action.payload.id);
      if (index >= 0) {
        state.products[index] = action.payload;
      } else {
        state.products.push(action.payload);
      }
    },
    removeProduct: (state, action: PayloadAction<string>) => {
      state.products = state.products.filter((p) => p.id !== action.payload);
    },
  },
});

export const { setProducts, addOrUpdateProduct, removeProduct } =
  catalogSlice.actions;
export default catalogSlice.reducer;

export const saveProduct = (product: Product) => async (dispatch: any) => {
  try {
    let resp: any;
    if (product && product.id)
      resp = await apiService
        .put(`/products/${product.id}`, product)
        .catch(() => null);
    if (!resp)
      resp = await apiService.post("/products", product).catch(() => product);
    const toStore = resp || product;
    storageService.saveProduct(toStore);
    dispatch(addOrUpdateProduct(toStore));
    return toStore;
  } catch (err) {
    storageService.saveProduct(product);
    dispatch(addOrUpdateProduct(product));
    throw err;
  }
};

export const deleteProductAsync = (id: string) => async (dispatch: any) => {
  try {
    await apiService.delete(`/products/${id}`).catch(() => null);
    storageService.deleteProduct(id);
    dispatch(removeProduct(id));
    return true;
  } catch (err) {
    throw err;
  }
};
