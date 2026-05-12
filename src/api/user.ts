import { http } from "@/utils/http";
import { apiUrl } from "@/api/base";

export type UserRole = "admin" | "user" | "guest";

export type UserInfo = {
  /** 用户id */
  id?: string | number;
  /** 创建时间 */
  createTime?: string;
  /** 头像 */
  avatar?: string;
  /** 用户名 */
  username: string;
  /** 昵称 */
  nickname?: string;
  /** 当前登录用户的角色（单个，后端返回） */
  role?: UserRole | string;
  /** 当前登录用户的角色列表 */
  roles?: Array<string>;
  /** 按钮级别权限 */
  permissions?: Array<string>;
  /** `token` */
  accessToken?: string;
  /** 用于调用刷新`accessToken`的接口时所需的`token` */
  refreshToken?: string;
  /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
  expires?: Date;
};

export type UserResult = {
  code: number;
  msg: string;
  data: UserInfo;
};

export type RefreshTokenResult = {
  code: number;
  msg: string;
  data: {
    /** `token` */
    accessToken: string;
    /** 用于调用刷新`accessToken`的接口时所需的`token` */
    refreshToken: string;
    /** `accessToken`的过期时间（格式'xxxx/xx/xx xx:xx:xx'） */
    expires: Date;
  };
};

export type UserAuthRequest = {
  username: string;
  password: string;
};

function ensureWritableUserId(userId: string | number) {
  if (String(userId) === "0") {
    throw new Error("游客只有只读权限");
  }
}

/** 登录 */
export const getLogin = (data?: UserAuthRequest) => {
  return http.request<UserResult>("post", "/user/login", { data });
};

/** 游客登录 */
export const guestLogin = () => {
  return http.request<UserResult>("post", "/user/guest-login");
};

/** 注册 */
export const register = (data?: UserAuthRequest) => {
  return http.request<UserResult>("post", "/user/register", { data });
};

/** 刷新`token` */
export const refreshTokenApi = (data?: object) => {
  return http.request<RefreshTokenResult>("post", "/refresh-token", { data });
};

// ---- 项目组相关 API ----

export type ProjectItem = {
  id: string;
  projectName: string;
  description: string;
  ownerId: string;
  createTime: string;
};

export type ProjectListResult = {
  code: number;
  msg: string;
  data: ProjectItem[];
};

export type CreateProjectRequest = {
  projectName: string;
  userId: string | number;
  description: string;
};

export type CreateProjectResult = {
  code: number;
  msg: string;
  data: ProjectItem;
};

export type AiPromptConfig = {
  id?: number;
  promptKey: string;
  promptName: string;
  promptContent: string;
  enabled: boolean;
  updateUserId?: number;
  createTime?: string;
  updateTime?: string;
};

export type PromptConfigResult = {
  code: number;
  msg: string;
  data: AiPromptConfig;
};

/** 获取项目组列表 */
export const getProjectList = (userId: string) => {
  return http.request<ProjectListResult>("get", `/project/list/${userId}`);
};

/** 创建项目组 */
export const createProject = (data: CreateProjectRequest) => {
  ensureWritableUserId(data.userId);
  return http.request<CreateProjectResult>("post", "/project/create", { data });
};

/** 获取侨批 AI 提示词 */
export const getQiaopiPrompt = () => {
  return http.request<PromptConfigResult>("get", "/prompt/qiaopi");
};

/** 更新侨批 AI 提示词 */
export const updateQiaopiPrompt = (data: {
  userId: string | number;
  promptContent: string;
}) => {
  ensureWritableUserId(data.userId);
  return http.request<PromptConfigResult>("post", "/prompt/qiaopi/update", {
    data
  });
};

// ---- 标注相关 API ----

export type AnnotationItem = {
  id: string;
  imageUrl: string;
  annotated: boolean;
  updateTime: string;
};

export type AnnotationListResult = {
  code: number;
  msg: string;
  data: AnnotationItem[];
};

/** 根据项目 id 获取标注列表 */
export const getAnnotationList = (
  projectId: string | number,
  annotated?: boolean
) => {
  const params: { projectId: string | number; annotated?: boolean } = { projectId };
  if (typeof annotated === "boolean") {
    params.annotated = annotated;
  }

  return http.request<AnnotationListResult>("get", "/annotation/list", {
    params
  });
};

// ---- 标注详情 ----

export type AnnotationDetailItem = {
  id: string;
  imageUrl: string;
  ocrRawJson: string;
  manualAnnotationJson: string | null;
  projectId: string;
  annotatorId: string;
  status: string;
  createTime: string;
  updateTime: string;
};

export type AnnotationDetailResult = {
  code: number;
  msg: string;
  data: AnnotationDetailItem;
};

export type OcrUploadResult = {
  code: number;
  msg?: string;
  data?: any;
};

/** 获取单条标注详情 */
export const getAnnotationDetail = (annotationId: string | number) => {
  return http.request<AnnotationDetailResult>("get", "/annotation/detail", {
    params: { annotationId }
  });
};

/**
 * 上传单张图片到 OCR 接口
 * 说明：后端当前仅支持串行处理，因此批量上传需在调用端按顺序逐张调用此方法
 */
export const uploadOcrImage = async (
  file: File,
  params: { projectId: string | number; userId: string | number }
) => {
  const { projectId, userId } = params;
  ensureWritableUserId(userId);
  const query = new URLSearchParams({
    projectId: String(projectId),
    userId: String(userId)
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(apiUrl("/ocr/upload", query), {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = (await response.json()) as OcrUploadResult;
  const topCode = Number(result?.code);
  const nestedCode = Number((result?.data as any)?.code);
  const topOk = topCode === 0 || topCode === 200;
  const nestedOk = Number.isNaN(nestedCode) || nestedCode === 0 || nestedCode === 200;

  if (!topOk || !nestedOk) {
    const nestedMsg = (result?.data as any)?.msg;
    throw new Error(nestedMsg || result?.msg || "OCR 处理失败");
  }

  return result;
};
