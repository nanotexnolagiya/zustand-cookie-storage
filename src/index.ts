import { CustomObject, deleteCookie, eachRecursive, getAllCookiesStartWith, mergeDeep, setCookie, setNestedKeys } from "./utils";

interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}



export const cookieStorage: StateStorage = {
  getItem: (key) => {
    const keyCookies: Record<string, string> = getAllCookiesStartWith(key);

    let keyObject: CustomObject = {};
    Object.keys(keyCookies).forEach((startWithKey) => {
      const keySegments = startWithKey.split("|");

      keyObject = mergeDeep(
        keyObject,
        setNestedKeys(keySegments, keyCookies[startWithKey]) as Record<
          string,
          any
        >
      );
    });

    return JSON.stringify(keyObject[key]);
  },
  setItem: (storeKey, value) => {
    const days = 30;
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    const jsonValue = JSON.parse(value);
    cookieStorage.removeItem(storeKey);

    eachRecursive(jsonValue, (key: string, value: any) => {
      const _value = Array.isArray(value) ? JSON.stringify(value) : value;
      setCookie(`${storeKey}${key}`, _value, {
        expires,
        path: "/",
      });
    });
  },
  removeItem: (key) => {
    const keyCookies: Record<string, string> = getAllCookiesStartWith(key);

    Object.keys(keyCookies).forEach((k) => {
      deleteCookie(k);
    });
  },
};
