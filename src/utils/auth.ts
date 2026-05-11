import Cookies from "js-cookie";
import { useUserStoreHook } from "@/store/modules/user";

export interface DataInfo<T> {
  id?: string;
  accessToken: string;
  expires: T;
  refreshToken: string;
  avatar?: string;
  username?: string;
  nickname?: string;
  roles?: string[];
  permissions?: string[];
}

export const userKey = "user-info";
export const TokenKey = "authorized-token";
export const multipleTabsKey = "multiple-tabs";

function readLocalUser(): DataInfo<number> | null {
  try {
    const raw = window.localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function getToken(): DataInfo<number> | null {
  const rawToken = Cookies.get(TokenKey);
  if (rawToken) {
    try {
      return JSON.parse(rawToken);
    } catch {
      return null;
    }
  }
  return readLocalUser();
}

export function setToken(data: DataInfo<Date | number | string>) {
  const expires = new Date(data.expires).getTime();
  const accessToken = data.accessToken;
  const refreshToken = data.refreshToken;
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });

  if (Number.isFinite(expires) && expires > Date.now()) {
    Cookies.set(TokenKey, cookieString, {
      expires: (expires - Date.now()) / 86400000
    });
  } else {
    Cookies.set(TokenKey, cookieString);
  }
  Cookies.set(multipleTabsKey, "true");

  const userInfo = {
    id: data.id ?? "",
    refreshToken,
    expires,
    avatar: data.avatar ?? "",
    username: data.username ?? "",
    nickname: data.nickname ?? "",
    roles: data.roles ?? [],
    permissions: data.permissions ?? []
  };
  window.localStorage.setItem(userKey, JSON.stringify(userInfo));
  useUserStoreHook().setUserInfo(userInfo);
}

export function removeToken() {
  Cookies.remove(TokenKey);
  Cookies.remove(multipleTabsKey);
  window.localStorage.removeItem(userKey);
}

export const formatToken = (token: string): string => {
  return `Bearer ${token}`;
};

export const hasPerms = (value: string | string[]): boolean => {
  const { permissions } = useUserStoreHook();
  const required = Array.isArray(value) ? value : [value];
  return required.every(item => permissions.includes(item));
};
