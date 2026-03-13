# 侨批图像标注系统 - 管理平台

> 基于 Vue 3 + Element Plus 的侨批图像智能标注前端管理系统

**中文** | [English](./README.en-US.md)

## 项目简介
本项目为毕业设计前端管理平台，基于 [pure-admin-thin](https://github.com/pure-admin/pure-admin-thin) 二次开发，用于侨批图像的识别、人工校正和标注管理。

核心目标：
- 支持侨批图像 OCR 结果可视化
- 支持人工校正文本并保存
- 支持按项目维度管理标注任务

## 当前功能
- 用户登录、注册、权限基础能力
- 项目组管理与项目列表
- 项目标注列表页（卡片模式）
- 新增标注：上传图片并触发 OCR
- 标注详情：加载已有 OCR/人工标注
- 校正文本编辑与人工标注保存
- OCR 识别与保存过程动画提示

## 标注模块入口
路由（`src/router/modules/classinfo.ts`）：
- `/classinfo/detail/:projectId/annotation/new` 新增标注
- `/classinfo/detail/:projectId/annotation/:annotationId` 标注详情

从项目详情页 `src/views/classinfo/detail.vue` 可进入：
- 点击 `新增标注图片` 按钮
- 点击图片卡片进入对应标注详情

标注模块详细文档见：`src/other/README.md`

## 技术栈
- Vue 3
- TypeScript
- Vite
- Element Plus
- Tailwind CSS
- Pinia
- Vue Router
- Axios

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

生产构建：
```bash
pnpm build
```

预览构建：
```bash
pnpm preview
```

## 接口概览（标注相关）
- `POST /ocr/upload` 上传图片并 OCR 识别
- `GET /annotation/detail` 获取单条标注详情
- `POST /annotation/save` 保存人工标注结果

说明：`manualAnnotationJson` 与 `ocrRawJson` 结构保持一致，保存时前端会基于 `ocrRawJson` 结构替换 `rec_texts`。

## 目录结构（节选）
```text
src/
  api/                API 定义
  router/             路由模块
  views/              业务页面
    classinfo/        项目组与标注列表
  other/              标注模块
    views/            AnnotationView.vue
    http/             标注接口与数据转换
    styles/           标注页面样式
```

## 许可证
本项目基于 MIT License。

- 原始模板：pure-admin-thin (MIT)
- 二次开发：侨批图像标注系统（2026）

详见 `LICENSE`。

## 说明
本项目为毕业设计作品，仅用于学习与研究。
