export default {
  path: "/userinfo",
  name: "userinfo",
  redirect: "/userinfo",
  meta: {
    title: "用户信息",
    icon: "material-symbols:person",
    rank: 1
  },
  children: [
    {
      path: "/userinfo/admin",
      name: "admin",
      component: () => import("@/views/userinfo/admin/index.vue"),
      meta: {
        title: "管理员信息",
        showParent: true
      }
    },
    {
      path: "/userinfo/teacher",
      name: "teacher",
      component: () => import("@/views/userinfo/teacher/index.vue"),
      meta: {
        title: "教师信息",
        showParent: true
      }
    },
    {
      path: "/userinfo/customer",
      name: "customer",
      component: () => import("@/views/userinfo/customer/index.vue"),
      meta: {
        title: "客户信息",
        showParent: true
      }
    }
  ]
};
