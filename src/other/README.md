# 侨批标注模块 README

## 1. 模块说明
`src/other` 为侨批图像标注模块，负责：
- 上传图片并触发 OCR 识别
- 展示 OCR 结果与坐标框
- 编辑校正文本
- 保存人工标注结果
- 查看历史标注详情

核心文件：
- `src/other/views/AnnotationView.vue`：标注界面
- `src/other/http/api.js`：标注相关接口与数据转换
- `src/other/styles/annotation.css`：页面样式
- `src/other/mockData1.js`：本地 mock 数据

## 2. 路由入口
由 `src/router/modules/classinfo.ts` 注册：
- 新增标注页：`/classinfo/detail/:projectId/annotation/new`
- 标注详情页：`/classinfo/detail/:projectId/annotation/:annotationId`

从项目详情页 `src/views/classinfo/detail.vue` 进入：
- 顶部按钮 `新增标注图片` -> 新增标注页
- 点击标注卡片 -> 标注详情页

## 3. 页面行为
`AnnotationView.vue` 的主要流程：
1. `annotation/new`：用户上传图片，调用 `/ocr/upload`
2. `annotation/:annotationId`：进入时自动调用 `/annotation/detail` 拉取详情
3. 左侧展示原图与 bbox，右侧展示文本区域
4. 编辑面板中可修改 `校正文本`
5. 点击 `保存标注` 调用 `/annotation/save`

加载动画：
- OCR 识别中：`isUploading = true`
- 保存中：`isSaving = true`

## 4. 接口约定
后端基地址（当前写死）：
- `API_BASE_URL = http://127.0.0.1:1031`

### 4.1 上传并识别
- `POST /ocr/upload?projectId={projectId}&userId={userId}`
- Body: `multipart/form-data`，字段 `file`
- 成功后解析返回 `ocrRawJson`

### 4.2 获取标注详情
- `GET /annotation/detail?annotationId={annotationId}`
- 返回 `ocrRawJson` 与 `manualAnnotationJson`

### 4.3 保存人工标注
- `POST /annotation/save`
- Body:
```json
{
  "annotationId": 0,
  "annotatorId": 0,
  "manualAnnotationJson": "string"
}
```

`manualAnnotationJson` 生成规则：
- 以 `ocrRawJson` 的原始结构为基准
- 仅替换 `result.ocrResults[0].prunedResult.rec_texts`
- 替换后的文本来自页面编辑后的 `corrected_text`

## 5. 数据转换规则
在 `src/other/http/api.js` 中实现：
- `ocr_text` 来自 `ocrRawJson.rec_texts`
- `corrected_text` 优先来自 `manualAnnotationJson.rec_texts`
- 若 `manualAnnotationJson` 缺失或为空，`corrected_text` 回退到 `ocrRawJson.rec_texts`

前端渲染行结构：
```js
{
  line_id: number,
  ocr_text: string,
  corrected_text: string,
  bbox: [x1, y1, x2, y2],
  score: number,
  entities: []
}
```

说明：
- 当前 `bbox` 使用 `[x1, y1, x2, y2]` 格式
- 置信度来自 `rec_scores`

## 6. 当前实现细节
- 编辑面板仅保留：`OCR原文`、`校正文本`、`识别置信度`
- 实体标注 UI 已移除（后续可按需求恢复）
- 标注保存前后使用遮罩动画，避免重复点击

## 7. 联调注意事项
1. `annotationId`、`projectId`、`userId` 必须可用
2. `manualAnnotationJson` 与 `ocrRawJson` 结构需一致
3. 后端若返回双层 `data` 包裹，前端已做兼容处理
4. 若保存失败，请优先检查：
   - `rawData.ocrRawJson` 是否存在
   - `annotationId / annotatorId` 是否为有效数字

## 8. 后续建议
- 将 `API_BASE_URL` 改为读取 `VITE_API_URL`
- 保存成功后自动刷新当前详情
- 增加离开页面未保存提示
