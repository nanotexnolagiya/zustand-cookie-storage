import Cookies from "js-cookie";

interface StateStorage {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
}

type CustomObject = Record<string, any>

function isObject(item?: CustomObject | CustomObject[]) {
  return item && typeof item === "object" && !Array.isArray(item);
}

function mergeDeep(
  target: CustomObject,
  ...sources: CustomObject[]
) {
  if (!sources.length) return target;
  const source = sources.shift();

  if (isObject(target) && isObject(source)) {
    for (const key in source) {
      if (isObject(source[key])) {
        if (!target[key]) Object.assign(target, { [key]: {} });
        mergeDeep(target[key], source[key]);
      } else {
        Object.assign(target, { [key]: source[key] });
      }
    }
  }

  return mergeDeep(target, ...sources);
}

const eachRecursive = (
  obj: CustomObject,
  cb: (k: string, v: any) => void,
  parentKey: string = ""
) => {
  Object.keys(obj).forEach((key) => {
    if (isObject(obj[key]))
      eachRecursive(obj[key], cb, [parentKey, key].join("|"));
    else cb([parentKey, key].join("|"), obj[key]);
  });
};

const getAllCookiesStartWith = (startWithKey: string) => {
  return document.cookie
    .split(";")
    .map((cv) => cv.split("=").map((v) => v.trim()))
    .filter(([key]) => key !== startWithKey && key.startsWith(startWithKey))
    .reduce((ac, [key, value]) => Object.assign(ac, { [key]: value }), {});
};

const isArrayString = (v: string) => v.startsWith("[") && v.endsWith("]");

function setNestedKeys(keys: string[], value: any) {
  const decodedValue = decodeURIComponent(value);
  if (keys.length === 0) {
    if (isArrayString(decodedValue)) {
      return JSON.parse(decodedValue);
    } else if (['true', 'false'].includes(decodedValue)) {
      return decodedValue !== 'false'
    }
    return decodedValue;
  }

  // Initialize an empty object
  const result: CustomObject = {};

  // Get the first key from the array
  const [firstKey, ...restKeys] = keys;

  // Recursively call setNestedKeys to build the nested structure
  result[firstKey] = setNestedKeys(restKeys, value);

  return result;
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
      Cookies.set(`${storeKey}${key}`, _value, {
        expires,
        path: "/",
      });
    });
  },
  removeItem: (key) => {
    const keyCookies: Record<string, string> = getAllCookiesStartWith(key);

    Object.keys(keyCookies).forEach((k) => {
      Cookies.remove(k);
    });
  },
};
