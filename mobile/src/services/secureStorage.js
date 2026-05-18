import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// expo-secure-store só funciona em iOS/Android (Keychain/Keystore).
// Em web caímos no localStorage para o app rodar via `npm run web`.
const isWeb = Platform.OS === "web";

export const getItem = async (key) => {
  if (isWeb) {
    return Promise.resolve(window.localStorage.getItem(key));
  }
  return SecureStore.getItemAsync(key);
};

export const setItem = async (key, value) => {
  if (isWeb) {
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  }
  return SecureStore.setItemAsync(key, value);
};

export const deleteItem = async (key) => {
  if (isWeb) {
    window.localStorage.removeItem(key);
    return Promise.resolve();
  }
  return SecureStore.deleteItemAsync(key);
};
