# AnnotationView.vue 修改说明

## 修改概述
将原有的两栏布局修改为三栏布局，适配新的后端数据结构。

## 主要修改内容

### 1. 布局调整
- **原布局**：左右两栏（图像 + 标注）
- **新布局**：三栏（图像 + 标注 + 信息）
  - 左侧（35%）：图像显示区
  - 中间（35%）：OCR 结果标注区
  - 右侧（30%）：结构化信息面板

### 2. 数据结构适配

#### 原数据结构
```javascript
{
  annotationData: [
    {
      line_id: 1,
      bbox: [x1, y1, x2, y2],
      ocr_text: "原文",
      corrected_text: "校正文本",
      score: 0.95,
      entities: [...]
    }
  ]
}
```

#### 新数据结构
```javascript
{
  code: 200,
  data: {
    annotation: {
      columnAnnotations: [
        {
          id: "33",
          colId: 1,
          content: "原文",
          contentChange: "校正文本",
          coordX1: 875,
          coordX2: 980,
          coordY1: 150,
          coordY2: 980,
          uncertainNote: "不确定的说明"
        }
      ],
      structuredInfo: {
        sender: "寄件人",
        receiver: "收件人",
        sendPlace: "寄件地",
        receivePlace: "收件地",
        originalDate: "十八年六月十五",
        gregorianDate: "1929年7月21日",
        remittanceInfo: "華洋叄枚",
        coreEvent: "核心内容摘要",
        confidence: 0.95,
        confidenceCalculation: "置信度计算说明"
      },
      classicalTerms: [
        { term: "内兄", explanation: "解释" }
      ],
      dialectNotes: [
        { original: "華洋", note: "方言注释" }
      ],
      needReviewItems: [
        { item: "需要复核的项目" }
      ]
    },
    imageInput: "图片URL",
    tokenUsage: {
      promptTokens: 2962,
      completionTokens: 4618,
      totalTokens: 7580
    }
  }
}
```

### 3. 字段映射
- `line_id` → `colId`
- `ocr_text` → `content`
- `corrected_text` → `contentChange`
- `bbox: [x1, y1, x2, y2]` → `coordX1, coordY1, coordX2, coordY2`
- 新增：`uncertainNote`（不确定说明）

### 4. 新增功能

#### 右侧信息面板显示：
1. **基础元数据**
   - 寄件人、收件人
   - 寄件地、收件地
   - 原文日期、公历日期
   - 侨汇信息

2. **核心内容摘要**
   - 显示侨批核心事件

3. **文言词汇解释**
   - 术语及其解释

4. **方言俗字注释**
   - 方言词汇及注释

5. **需要人工复核项**
   - 警告提示样式

6. **识别置信度**
   - 整体置信度可视化
   - 置信度计算说明

7. **Token 使用情况**
   - 提示词、生成内容、总计

### 5. 修改的函数

- `uploadAndProcess()` - 适配新的数据结构解析
- `loadExistingAnnotation()` - 加载已有标注时适配新结构
- `save()` - 保存时转换为后端需要的格式
- `handleBboxClick()`, `handleLineClick()` 等 - 使用 `colId` 替代 `line_id`
- 删除了实体标注相关函数（新数据中没有实体）

### 6. CSS 样式新增

- `.main-content-three-columns` - 三栏布局容器
- `.column-left`, `.column-middle`, `.column-right` - 三栏样式
- `.info-panel` - 信息面板容器
- `.info-section` - 信息区块
- `.term-item`, `.dialect-item`, `.review-item` - 各类信息项样式

## 使用方式

### 加载已有标注
路由参数包含 `annotationId` 时，自动调用 `/annotation/detail` 接口加载数据

### 上传新图片
点击"上传图片"按钮，调用 `processImage` 接口进行 OCR 识别

### 编辑标注
1. 点击左侧或中间的某一列/行
2. 底部弹出编辑面板
3. 可修改校正文本、不确定说明等
4. 点击"保存标注"提交

### 交互联动
- 鼠标悬停：左中两侧对应列同时高亮
- 点击选择：左中联动，选中同一列
- 编辑保存：修改后保存到后端

## 注意事项

1. 需要确保后端接口返回的数据格式与新结构一致
2. `processImage` 和 `getAnnotationDetail` 接口都需要返回新格式
3. `saveAnnotation` 接口需要接受新的保存格式
4. 如果后端接口尚未修改，需要在 `api.js` 中添加数据转换层

## 兼容性建议

如果需要兼容旧的数据格式，可以在数据加载函数中添加格式检测和转换逻辑：

```javascript
function normalizeData(result) {
  // 检测是否为新格式
  if (result.data && result.data.annotation) {
    return transformNewFormat(result.data)
  }
  // 旧格式处理
  return transformOldFormat(result)
}
```
