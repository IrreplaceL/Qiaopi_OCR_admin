const Layout = () => import("@/layout/index.vue");

export default [
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/login/index.vue"),
    meta: {
      title: "登录",
      showLink: false,
      rank: 101
    }
  },
  {
    path: "/redirect",
    component: Layout,
    meta: {
      title: "加载中...",
      showLink: false,
      rank: 102
    },
    children: [
      {
        path: "/redirect/:path(.*)",
        name: "Redirect",
        component: () => import("@/layout/redirect.vue")
      }
    ]
  },
  {
    path: "/classinfo/detail",
    component: Layout,
    meta: {
      title: "项目详情",
      showLink: false,
      rank: 103
    },
    children: [
      {
        path: "/classinfo/detail/:projectId",
        name: "classinfoDetail",
        component: () => import("@/views/classinfo/detail.vue"),
        meta: {
          title: "项目详情",
          showLink: false
        }
      }
    ]
  }
] satisfies Array<RouteConfigsTable>;
