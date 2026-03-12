# 侨批图像标注系统 - 管理平台

> 基于大小模型结合的侨批图像标注软件（前端管理系统）

## 🎓 项目说明

本项目是一个**毕业设计作品**，基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 开源模板进行二次开发，用于侨批图像的智能标注与管理。

### 项目背景

侨批是海外华侨通过民间渠道及后来的金融邮政机构寄回国内、连带家书或简单附言的汇款凭证，具有重要的历史文化价值。本系统利用大小模型结合的方式，实现对侨批图像的智能识别与标注，为侨批文化的数字化保护提供技术支持。

## ✨ 主要功能

- 🔐 **用户认证系统** - 登录、注册、权限管理
- 🖼️ **图像标注管理** - 侨批图像的上传、标注、审核
- 🤖 **AI 辅助标注** - 基于大小模型结合的智能识别
- 👥 **用户管理** - 标注员、审核员、管理员管理
- 📊 **数据统计** - 标注进度、质量统计
- 📝 **标注历史** - 标注记录查询与管理

## 🛠️ 技术栈

### 前端框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具

### UI 框架
- **Element Plus** - 基于 Vue 3 的组件库
- **Tailwind CSS** - 实用优先的 CSS 框架

### 状态管理
- **Pinia** - Vue 官方推荐的状态管理库
- **Vue Router** - Vue.js 官方路由

### 其他工具
- **Axios** - HTTP 请求库
- **ECharts** - 数据可视化图表库
- **Day.js** - 轻量级时间处理库

## 📦 安装与运行

### 环境要求
- Node.js: `^18.18.0 || ^20.9.0 || >=21.1.0`
- pnpm: `>=9`

### 安装依赖
```bash
pnpm install
```

### 开发模式
```bash
pnpm dev
```

### 生产构建
```bash
pnpm build
```

### 预览构建结果
```bash
pnpm preview
```

## 📁 项目结构

```
qiaopi-annotation-system/
├── src/
│   ├── api/              # API 接口定义
│   ├── assets/           # 静态资源
│   ├── components/       # 公共组件
│   ├── layout/           # 布局组件
│   ├── router/           # 路由配置
│   ├── store/            # 状态管理
│   ├── utils/            # 工具函数
│   └── views/            # 页面组件
│       ├── login/        # 登录页面
│       ├── userinfo/     # 用户管理
│       ├── annotation/   # 标注管理（待开发）
│       └── statistics/   # 数据统计（待开发）
├── public/               # 公共静态文件
└── types/                # TypeScript 类型定义
```

## 🔌 后端接口

### 用户认证

#### 登录
```
POST /user/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "code": 0,
  "msg": "success",
  "data": {
    "username": "string",
    "accessToken": "string",
    "refreshToken": "string"
  }
}
```

#### 注册
```
POST /user/register
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response:
{
  "code": 0,
  "msg": "success",
  "data": {}
}
```

## 🎯 开发进度

- [x] 项目初始化与配置
- [x] 用户登录功能
- [x] 基础布局与导航
- [ ] 图像上传与管理
- [ ] AI 标注功能集成
- [ ] 标注审核流程
- [ ] 数据统计与可视化
- [ ] 导出功能

## 📝 许可证

本项目基于 **MIT License** 开源。

- 原始模板：[pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) (MIT License)
- 二次开发：侨批图像标注系统 (2026)

详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

- 感谢 [pure-admin](https://github.com/pure-admin) 团队提供优秀的开源模板
- 感谢所有开源项目的贡献者

## 📮 联系方式

如有问题或建议，欢迎联系：
- 作者：[Your Name]
- 邮箱：[your.email@example.com]

---

**注意**：本项目为毕业设计作品，仅用于学习和研究目的。
