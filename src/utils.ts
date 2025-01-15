export type CustomObject = Record<string, any>;

export function isObject(item?: CustomObject | CustomObject[]) {
  return item && typeof item === "object" && !Array.isArray(item);
}

export function mergeDeep(target: CustomObject, ...sources: CustomObject[]) {
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

export const eachRecursive = (
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

export const getAllCookiesStartWith = (startWithKey: string) => {
  return document.cookie
    .split(";")
    .map((cv) => cv.split("=").map((v) => v.trim()))
    .filter(([key]) => key !== startWithKey && key.startsWith(startWithKey))
    .reduce((ac, [key, value]) => Object.assign(ac, { [key]: value }), {});
};

const isArrayString = (v: string) => v.startsWith("[") && v.endsWith("]");

export function setNestedKeys(keys: string[], value: any) {
  const decodedValue = decodeURIComponent(value);
  if (keys.length === 0) {
    if (isArrayString(decodedValue)) {
      return JSON.parse(decodedValue);
    } else if (["true", "false"].includes(decodedValue)) {
      return decodedValue !== "false";
    }
    return decodedValue;
  }
  const result: CustomObject = {};
  const [firstKey, ...restKeys] = keys;
  result[firstKey] = setNestedKeys(restKeys, value);
  return result;
}

interface CookieAttributes {
  expires?: number | Date | undefined;
  path?: string | undefined;
  domain?: string | undefined;
  secure?: boolean | undefined;
  sameSite?: "strict" | "Strict" | "lax" | "Lax" | "none" | "None" | undefined;
}

export function setCookie(
  name: string,
  value: string,
  options?: CookieAttributes
) {
  let cookieString = `${encodeName(name)}=${encodeValue(value)}`;

  if (options) {
    if (options.expires) {
      if (typeof options.expires === "number") {
        const date = new Date();
        date.setTime(date.getTime() + options.expires * 24 * 60 * 60 * 1000); // Convert days to milliseconds
        cookieString += `; expires=${date.toUTCString()}`;
      } else if (options.expires instanceof Date) {
        cookieString += `; expires=${options.expires.toUTCString()}`;
      }
    }
    if (options.path) {
      cookieString += `; path=${options.path}`;
    }
    if (options.domain) {
      cookieString += `; domain=${options.domain}`;
    }
    if (options.secure) {
      cookieString += `; secure`;
    }
    if (options.sameSite) {
      cookieString += `; samesite=${options.sameSite}`;
    }
  }

  // Set the cookie
  document.cookie = cookieString;
}

// Function to delete a cookie
export function deleteCookie(name: string) {
  document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
}

const encodeName = (name: string) =>
  encodeURIComponent(name)
  .replace(/%(2[346B]|5E|60|7C)/g, decodeURIComponent)

const encodeValue = (value: string) =>
  encodeURIComponent(value as string).replace(
    /%(2[346BF]|3[AC-F]|40|5[BDE]|60|7[BCD])/g,
    decodeURIComponent
  )