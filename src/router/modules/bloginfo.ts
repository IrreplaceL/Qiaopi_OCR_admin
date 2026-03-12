export default {
  path: "/bloginfo",
  name: "bloginfo",
  redirect: "/bloginfo",
  meta: {
    title: "文章管理",
    icon: "material-symbols:book-2-outline",
    rank: 3
  },
  children: [
    {
      path: "/bloginfo/atircle",
      name: "atircle",
      component: () => import("@/views/bloginfo/atircle/index.vue"),
      meta: {
        title: "文章信息",
        showParent: true
      }
    },
    {
      path: "/bloginfo/comment",
      name: "comment",
      component: () => import("@/views/bloginfo/comment/index.vue"),
      meta: {
        title: "评论信息",
        showParent: true
      }
    }
  ]
};
