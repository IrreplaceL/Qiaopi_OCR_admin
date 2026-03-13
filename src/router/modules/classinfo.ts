const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/classinfo",
  component: Layout,
  name: "classinfoRoot",
  redirect: "/classinfo/index",
  meta: {
    title: "识别组",
    icon: "material-symbols:folder-supervised-outline",
    rank: 2
  },
  children: [
    {
      path: "/classinfo/index",
      name: "classinfo",
      component: () => import("@/views/classinfo/index.vue"),
      meta: {
        title: "识别组",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    },
    {
      path: "/classinfo/detail/:projectId",
      name: "classinfoDetail",
      component: () => import("@/views/classinfo/detail.vue"),
      meta: {
        title: "项目详情",
        showLink: false
      }
    },
    {
      path: "/classinfo/detail/:projectId/annotation/new",
      name: "classinfoAnnotationNew",
      component: () => import("@/other/views/AnnotationView.vue"),
      meta: {
        title: "新增标注图片",
        showLink: false
      }
    },
    {
      path: "/classinfo/detail/:projectId/annotation/:annotationId",
      name: "classinfoAnnotationDetail",
      component: () => import("@/other/views/AnnotationView.vue"),
      meta: {
        title: "标注详情",
        showLink: false
      }
    }
  ]
};
