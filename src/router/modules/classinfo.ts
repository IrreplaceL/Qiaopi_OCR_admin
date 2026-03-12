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
    }
  ]
};
