import { defineStore } from "pinia";
import { store } from "@/store";
import {
  type UserAuthRequest,
  type UserResult,
  type RefreshTokenResult,
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
  roles: string[];
  permissions: string[];
};

export const useUserStore = defineStore({
  id: "qiaopi-user",
  state: (): UserState => {
    const userInfo = readUserInfo();
    return {
      userId: userInfo.id ?? "",
      avatar: userInfo.avatar ?? "",
      username: userInfo.username ?? "",
      nickname: userInfo.nickname ?? "",
      roles: userInfo.roles ?? [],
      permissions: userInfo.permissions ?? []
    };
  },
  actions: {
    setUserInfo(data: Partial<DataInfo<number | Date>>) {
      this.userId = data.id ?? "";
      this.avatar = data.avatar ?? "";
      this.username = data.username ?? "";
      this.nickname = data.nickname ?? data.username ?? "";
      this.roles = data.roles ?? [];
      this.permissions = data.permissions ?? [];
    },
    async loginByUsername(data: UserAuthRequest) {
      const result: UserResult = await getLogin(data);
      if (result?.code === 200) {
        const userData = result.data;
        const normalized = {
          ...userData,
          id: userData.id || "",
          avatar: userData.avatar || "",
          nickname: userData.nickname || userData.username,
          roles: userData.roles || (userData.role ? [userData.role] : ["user"]),
          permissions: userData.permissions || [],
          accessToken: userData.accessToken || userData.id || "",
          refreshToken: userData.refreshToken || userData.id || "",
          expires:
            userData.expires ||
            new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        };
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
