import { configureStore, createSlice } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

// temporary slice until we add auth/chat slices
const appSlice = createSlice({
  name: "app",
  initialState: {},
  reducers: {},
});

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
    // auth: authReducer,
    // chat: chatReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
