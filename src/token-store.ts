export interface TokenStore {
  getToken(): string | null | Promise<string | null>;
  setToken(token: string | null): void | Promise<void>;
}

export function memoryTokenStore(initial: string | null = null): TokenStore {
  let token = initial;

  return {
    getToken() {
      return token;
    },
    setToken(value) {
      token = value;
    },
  };
}

const STORAGE_KEY = "brenox_token";

export function localStorageTokenStore(key = STORAGE_KEY): TokenStore {
  return {
    getToken() {
      if (typeof localStorage === "undefined") {
        return null;
      }
      return localStorage.getItem(key);
    },
    setToken(value) {
      if (typeof localStorage === "undefined") {
        return;
      }
      if (value === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, value);
      }
    },
  };
}
