import { defineStore } from "pinia";
import { store } from "@/store";
import {
  type UserAuthRequest,
  type UserInfo,
  type UserResult,
  type RefreshTokenResult,
  guestLogin,
  getLogin,
  refreshTokenApi
} from "@/api/user";
import { type DataInfo, setToken, removeToken, userKey } from "@/utils/auth";

function readUserInfo(): Partial<DataInfo<number>> {
  try {
    const raw = window.localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

type UserState = {
  userId: string;
  avatar: string;
  username: string;
  nickname: string;
  role: string;
  roles: string[];
  permissions: string[];
};

function normalizeUserInfo(userData: UserInfo) {
  const id = userData.id ?? "";
  const role = userData.role || userData.roles?.[0] || "user";
  const tokenValue = String(userData.accessToken ?? id ?? role);

  return {
    ...userData,
    id,
    avatar: userData.avatar || "",
    nickname: userData.nickname || userData.username,
    role,
    roles: userData.roles || [role],
    permissions: userData.permissions || [],
    accessToken: tokenValue,
    refreshToken: userData.refreshToken || tokenValue,
    expires:
      userData.expires ||
      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
  };
}

export const useUserStore = defineStore({
  id: "qiaopi-user",
  state: (): UserState => {
    const userInfo = readUserInfo();
    return {
      userId: String(userInfo.id ?? ""),
      avatar: userInfo.avatar ?? "",
      username: userInfo.username ?? "",
      nickname: userInfo.nickname ?? "",
      role: userInfo.role ?? userInfo.roles?.[0] ?? "",
      roles: userInfo.roles ?? [],
      permissions: userInfo.permissions ?? []
    };
  },
  getters: {
    isGuest: state => state.role === "guest" || state.userId === "0",
    isAdmin: state => state.role === "admin",
    currentUser: state => ({
      id: state.userId,
      username: state.username,
      nickname: state.nickname,
      role: state.role,
      roles: state.roles
    })
  },
  actions: {
    setUserInfo(data: Partial<DataInfo<number | Date>>) {
      this.userId = String(data.id ?? "");
      this.avatar = data.avatar ?? "";
      this.username = data.username ?? "";
      this.nickname = data.nickname ?? data.username ?? "";
      this.role = data.role ?? data.roles?.[0] ?? "";
      this.roles = data.roles ?? [];
      this.permissions = data.permissions ?? [];
    },
    async loginByUsername(data: UserAuthRequest) {
      const result: UserResult = await getLogin(data);
      if (result?.code === 200) {
        const normalized = normalizeUserInfo(result.data);
        setToken(normalized);
        this.setUserInfo(normalized);
      }
      return result;
    },
    async loginAsGuest() {
      const result: UserResult = await guestLogin();
      if (result?.code === 200) {
        const normalized = normalizeUserInfo(result.data);
        setToken(normalized);
        this.setUserInfo(normalized);
      }
      return result;
    },
    logOut() {
      this.setUserInfo({
        id: "",
        avatar: "",
        username: "",
        nickname: "",
        role: "",
        roles: [],
        permissions: []
      });
      removeToken();
      window.location.hash = "#/login";
    },
    async handRefreshToken(data: object) {
      const result: RefreshTokenResult = await refreshTokenApi(data);
      if (result?.data) {
        setToken(result.data);
      }
      return result;
    }
  }
});

export function useUserStoreHook() {
  return useUserStore(store);
}
