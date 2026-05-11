import { createRouter, createWebHashHistory, type RouteRecordRaw } from "vue-router";
import { getToken } from "@/utils/auth";

const Layout = () => import("@/layout/index.vue");

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: { title: "登录" }
  },
  {
    path: "/",
    component: Layout,
    redirect: "/classinfo/index",
    children: [
      {
        path: "/welcome",
        redirect: "/classinfo/index"
      },
      {
        path: "/classinfo/index",
        name: "classinfo",
        component: () => import("@/views/classinfo/index.vue"),
        meta: { title: "识别组列表" }
      },
      {
        path: "/classinfo/detail/:projectId",
        name: "classinfoDetail",
        component: () => import("@/views/classinfo/detail.vue"),
        meta: { title: "项目标注列表" }
      }
    ]
  },
  {
    path: "/classinfo/detail/:projectId/annotation/new",
    name: "classinfoAnnotationNew",
    component: () => import("@/other/views/AnnotationView.vue"),
    meta: { title: "新增标注图片" }
  },
  {
    path: "/classinfo/detail/:projectId/annotation/:annotationId",
    name: "classinfoAnnotationDetail",
    component: () => import("@/other/views/AnnotationView.vue"),
    meta: { title: "标注详情" }
  },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/classinfo/index"
  }
];

export const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { left: 0, top: 0 };
  }
});

router.beforeEach(to => {
  document.title = `${String(to.meta?.title || "侨批图像标注系统")} | 侨批图像标注系统`;

  if (to.path === "/login") return true;

  const token = getToken();
  if (!token?.accessToken) {
    return { path: "/login", query: { redirect: to.fullPath } };
  }

  return true;
});

export function resetRouter() {
  return undefined;
}

export default router;
