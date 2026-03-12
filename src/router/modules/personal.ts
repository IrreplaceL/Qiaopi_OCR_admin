const { VITE_HIDE_HOME } = import.meta.env;
const Layout = () => import("@/layout/index.vue");

export default {
  path: "/personal",
  component: Layout,
  name: "personal",
  redirect: "/personal",
  meta: {
    title: "账户设置",
    icon: "material-symbols:settings",
    rank: 4
  },
  children: [
    {
      path: "/personal",
      name: "personal",
      component: () => import("@/views/personal/index.vue"),
      meta: {
        title: "账户设置",
        showLink: VITE_HIDE_HOME === "true" ? false : true
      }
    }
  ]
};
