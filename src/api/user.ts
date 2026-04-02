import { http } from "@/utils/http";

export type UserResult = {
  code: number;
  msg: string;
  data: {
    /** 用户id */
    id?: string;
    /** 创建时间 */
    createTime?: string;
    /** 头像 */
    avatar?: string;
    /** 用户名 */
    username: string;
    /** 昵称 */
    nickname?: string;
    /** 当前登录用户的角色（单个，后端返回） */
    role?: string;
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

/** 登录 */
export const getLogin = (data?: UserAuthRequest) => {
  return http.request<UserResult>("post", "/user/login", { data });
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

/** 获取项目组列表 */
export const getProjectList = (userId: string) => {
  return http.request<ProjectListResult>("get", `/project/list/${userId}`);
};

/** 创建项目组 */
export const createProject = (data: CreateProjectRequest) => {
  return http.request<CreateProjectResult>("post", "/project/create", { data });
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
export const getAnnotationList = (projectId: string | number) => {
  return http.request<AnnotationListResult>("get", "/annotation/list", {
    params: { projectId }
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
  const query = new URLSearchParams({
    projectId: String(projectId),
    userId: String(userId)
  });

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`http://127.0.0.1:1031/ocr/upload?${query.toString()}`, {
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
