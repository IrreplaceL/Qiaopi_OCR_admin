# 侨批图像标注系统

侨批图像标注系统是一个面向侨批文献 OCR、人工校注和列级标注的前端工作台。项目已从 pure-admin 模板收束为轻量业务壳，保留登录注册、项目组、图片列表、OCR 上传和标注详情编辑等核心流程。

## 技术栈

- Vue 3
- TypeScript
- Vite
- Element Plus
- Pinia
- Vue Router
- Axios / Fetch

## 核心功能

- 登录、注册和本地 token 鉴权。
- 项目组列表与项目图片列表。
- 图片上传并触发 OCR 识别。
- 标注详情页三栏工作台：
  - 左侧侨批图像支持缩放、拖拽查看和列框编辑。
  - 标注框可选中、移动、缩放、新增和删除。
  - 中间“标注区”使用同一份列级数据同步展示 OCR 文本块。
  - 校正文本为空时自动回退显示 OCR 原文。
  - 右侧结构化信息支持独立滚动和表单编辑。
  - 编辑浮层支持拖动，避免遮挡标注区域。
- 点击“保存标注”后提交完整 `/annotation/save` payload，更新列级标注和结构化信息。

## 路由

当前路由为静态业务路由：

```text
/login
/classinfo/index
/classinfo/detail/:projectId
/classinfo/detail/:projectId/annotation/new
/classinfo/detail/:projectId/annotation/:annotationId
```

`/` 和旧 `/welcome` 会重定向到 `/classinfo/index`。标注详情页直接铺满工作区，不再包在 pure-admin 侧边栏、标签页或顶部壳中。

## API 规范

所有后端请求统一走同源 `/api` 前缀：

```text
VITE_API_URL=/api
VITE_API_PROXY_TARGET=http://127.0.0.1:1031
```

开发环境由 `vite.config.ts` 将 `/api` 代理到 `VITE_API_PROXY_TARGET`，并在代理时去掉 `/api` 前缀。生产环境应由服务器反代 `/api` 到后端服务。

统一基址封装在：

```text
src/api/base.ts
```

业务请求应复用 `apiUrl()` 或 `src/utils/http/index.ts` 中的 Axios 实例，不要在页面或接口文件里硬编码 `127.0.0.1:1031`、`localhost:1031` 等后端地址。

主要接口：

```text
POST /api/user/login
POST /api/user/register
GET  /api/project/list/:userId
POST /api/project/create
POST /api/ocr/upload
GET  /api/annotation/list
GET  /api/annotation/detail
POST /api/annotation/save
```

## 目录结构

```text
src/
  api/
    base.ts              统一 API 基址与 URL 拼接
    user.ts              登录、注册、项目组和列表接口
  layout/
    index.vue            轻量业务布局
  other/
    http/api.js          OCR 与标注详情接口
    styles/annotation.css
    views/AnnotationView.vue
  router/
    index.ts             静态业务路由
  store/
    modules/user.ts      用户状态和 token
  views/
    classinfo/           项目组与项目图片列表
    login/               登录注册页
```

`Qiaopi_OCR/` 是后端目录，本前端改动默认不修改该目录。

## 安装与运行

环境要求：

- Node.js `^18.18.0 || ^20.9.0 || >=21.1.0`
- pnpm `>=9`

安装依赖：

```bash
pnpm install
```

本地开发：

```bash
pnpm dev
```

类型检查：

```bash
pnpm typecheck
```

生产构建：

```bash
pnpm build
```

预览构建结果：

```bash
pnpm preview
```

注意：`pnpm build` 会先清理 `dist` 目录。

## 标注保存说明

标注页保存时会向 `/api/annotation/save` 提交完整结构，核心形态如下：

```json
{
  "success": true,
  "imageInput": "...",
  "annotation": {
    "columnAnnotations": [],
    "structuredInfo": {},
    "classicalTerms": [],
    "dialectNotes": [],
    "needReviewItems": [],
    "parseSuccess": true,
    "errorMsg": ""
  },
  "tokenUsage": null
}
```

前端编辑时列框坐标使用原图自然尺寸坐标 `bbox = [x1, y1, x2, y2]`。保存时会转换为后端 1000x1000 规范坐标并取整。

## 部署提示

生产环境建议同源部署前端，并在 Web 服务器中配置：

```text
/api/* -> 后端服务
```

这样浏览器 Network 中应只出现 `/api/...` 请求，不应出现直连 `127.0.0.1:1031` 或 `localhost:1031`。

## 验证建议

前端改动后优先运行：

```bash
pnpm typecheck
pnpm build
```

涉及标注页交互时，还应在浏览器中验证：

- OCR 上传和标注详情加载。
- 标注框移动、缩放、新增、删除。
- 标注区文本块同步变化。
- 结构化信息独立滚动。
- 保存后刷新仍能保留列坐标、文本和结构化信息。

## 许可证

本项目基于 MIT License。
