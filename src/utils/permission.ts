import type { UserInfo } from "@/api/user";

export const READONLY_MESSAGE = "游客只有只读权限";

export function isReadonlyUser(user?: Partial<UserInfo> | null) {
  return !user || user.role === "guest" || String(user.id ?? "") === "0";
}

export function assertWritable(user?: Partial<UserInfo> | null) {
  if (isReadonlyUser(user)) {
    throw new Error(READONLY_MESSAGE);
  }
}
