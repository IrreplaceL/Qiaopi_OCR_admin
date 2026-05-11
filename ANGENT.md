# ANGENT.md

本文件用于指导后续编码代理在本项目中工作。项目根目录为 `E:\Qiaopi_OCR_admin`。

## 最高优先级安全规则

- 禁止批量删除文件或目录。
- 不要使用 `del /s`、`rd /s`、`rmdir /s`、`Remove-Item -Recurse`、`rm -rf`。
- 需要删除文件时，只能一次删除一个明确路径的文件，例如：`Remove-Item "C:\path\to\file.txt"`。
- 如果确实需要批量删除文件，必须停止操作并请用户手动删除。
- 禁止覆盖用户已有文件，除非用户明确说“覆盖原文件”。
- 修改任何文件前，先确认不会覆盖用户手动修改。
- 默认另存为新文件，不直接替换原文件。
- 若目标文件已存在，必须改用新文件名。
- 发现锁文件或文件正在被打开时，停止写入。
- 任何不确定是否会丢失用户修改的操作，都必须停止并询问用户。
- 撤销修改前，先查找备份、临时文件或自动恢复文件，并让用户确认。
- 禁止使用 `-Force` 覆盖文件。

## 项目概览

这是一个侨批图像 OCR 与标注管理项目，包含两个主要部分：

- 根目录：前端管理端，基于 Vue 3、TypeScript、Vite、Element Plus、Pinia、Vue Router、Tailwind CSS。
- `Qiaopi_OCR/`：后端服务，基于 Java 17、Spring Boot、MyBatis-Plus、MySQL、Aliyun OSS、OkHttp。

前端主要处理登录、权限、项目管理、图像上传、OCR 结果展示、人工校正与标注保存。后端提供用户、项目、OCR 上传、标注详情与保存等接口。

## 常用命令

前端命令在项目根目录执行：

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
pnpm typecheck
pnpm lint
```

后端命令在 `Qiaopi_OCR/` 目录执行：

```bash
.\mvnw.cmd test
.\mvnw.cmd spring-boot:run
.\mvnw.cmd package
```

注意：`package.json` 中部分脚本会清理 `dist`、缓存或依赖目录。执行前必须确认用户允许，尤其不要运行会删除 `node_modules`、锁文件或构建目录的清理脚本。

## 目录说明

前端：

- `src/api/`：接口定义。
- `src/router/`：路由模块。
- `src/store/`：Pinia 状态管理。
- `src/views/`：业务页面。
- `src/views/classinfo/`：项目组与标注列表相关页面。
- `src/other/`：标注模块，包括 `AnnotationView.vue`、标注接口封装与辅助逻辑。
- `src/components/`：通用组件。
- `src/layout/`：布局、菜单、标签页、导航栏等。
- `mock/`：前端 mock 数据。
- `build/`：Vite 构建相关配置。

后端：

- `Qiaopi_OCR/src/main/java/com/qiaopi_ocr/controller/`：REST 控制器。
- `Qiaopi_OCR/src/main/java/com/qiaopi_ocr/service/`：业务服务。
- `Qiaopi_OCR/src/main/java/com/qiaopi_ocr/domain/entity/`：实体与返回结构。
- `Qiaopi_OCR/src/main/java/com/qiaopi_ocr/config/`：Web、JSON 等配置。
- `Qiaopi_OCR/src/main/resources/`：配置与资源文件。
- `Qiaopi_OCR/API.zh-CN.md`：后端接口文档。

## 编码约定

- 优先沿用项目现有写法，不引入新的框架或大型依赖。
- 前端使用 Vue 3 Composition API、TypeScript、Element Plus 与现有 pure-admin 风格组件。
- 路由变更优先查看 `src/router/modules/` 的既有模式。
- 接口变更需要同步检查前端 `src/api/`、后端 `controller/service` 和接口文档。
- OCR 与人工标注数据结构要特别谨慎，尤其是 `ocrRawJson`、`manualAnnotationJson`、`rec_texts` 等字段。
- 不要随意重排大文件、全量格式化无关文件或做无关重构。
- 新增逻辑尽量局部化，避免扩大改动范围。

## 验证建议

前端改动后，至少根据改动范围选择执行：

```bash
pnpm typecheck
pnpm lint
pnpm build
```

后端改动后，至少根据改动范围选择执行：

```bash
.\mvnw.cmd test
.\mvnw.cmd package
```

如果只改文档，可说明未运行构建或测试。

## 工作流程

1. 先查看当前 git 状态，确认是否有用户已有修改。
2. 阅读相关文件后再修改，避免凭猜测改动。
3. 修改前确认目标文件存在与否；新文件可直接创建，已有文件必须谨慎处理。
4. 改动保持小而清晰，只解决当前任务。
5. 改完后运行适当检查，并向用户说明执行结果。
6. 如果检查失败，优先定位与本次改动相关的问题；若失败来自已有环境或无关历史问题，应如实说明。

## Git 注意事项

- 不要执行 `git reset --hard`、`git checkout -- <file>` 等会丢弃用户修改的命令，除非用户明确要求。
- 不要回滚用户或其他代理已经做出的无关改动。
- 提交前只暂存本次任务相关文件。
- 如果工作区已有无关变更，保留并绕开它们。

## 文档与编码问题

仓库中部分中文 README 可能存在编码显示异常。修改这些文件前要先确认原始编码与用户意图，不要为了“修复乱码”而覆盖整篇文档。若需要重写文档，默认另存为新文件或先请用户确认。

