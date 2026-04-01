# 调试步骤 - AnnotationView 渲染问题

## 问题描述
接口返回成功（返回了完整的 JSON 数据），但页面没有渲染出内容。

## 已修复的问题

### 1. API 函数返回格式不匹配
**问题**：`getAnnotationDetail` 函数在尝试解析旧的数据格式（`ocrRawJson` 和 `manualAnnotationJson`），但后端已经返回新的数据结构。

**修复**：修改 `src/other/http/api.js` 中的 `getAnnotationDetail` 函数，直接返回完整的响应数据：
```javascript
export async function getAnnotationDetail(annotationId) {
  // ...
  const result = await response.json()
  // 直接返回完整响应，让组件自己处理
  return result
}
```

### 2. 组件中使用了不存在的变量
**问题**：模板中使用了 `entityTypes` 变量，但这个变量没有定义（已删除实体标注功能）。

**修复**：移除了实体类型标签的显示，改为显示文字方向提示。

## 调试步骤

### 1. 打开浏览器开发者工具
按 `F12` 或右键选择"检查"，切换到 Console 标签页。

### 2. 查看控制台输出
刷新页面后，应该能看到以下日志：
```
开始加载标注详情，ID: xxx
API 返回数据: {...}
解析 annotation: {...}
转换后的 annotationData: [...]
设置图片 URL: https://...
已有标注数据加载成功，annotationData: [...]
```

### 3. 检查关键数据

#### 检查 annotationData 是否正确转换
在控制台输入：
```javascript
// 查看 Vue 组件实例（如果使用 Vue DevTools）
$vm0.annotationData
```

#### 检查图片 URL 是否正确设置
```javascript
$vm0.imageUrl
```

#### 检查结构化信息是否加载
```javascript
$vm0.structuredInfo
$vm0.classicalTerms
$vm0.dialectNotes
```

### 4. 检查数据结构
打开 Network 标签，找到 `/annotation/detail` 请求，查看响应内容是否符合预期格式：

```json
{
  "code": 200,
  "data": {
    "annotation": {
      "columnAnnotations": [...],
      "structuredInfo": {...},
      "classicalTerms": [...],
      "dialectNotes": [...],
      "needReviewItems": [...]
    },
    "imageInput": "图片URL",
    "tokenUsage": {...}
  }
}
```

### 5. 检查路由参数
确认路由中包含正确的 `annotationId` 参数：
```javascript
// 在控制台输入
$route.params.annotationId
```

## 可能的其他问题

### 问题 1：图片跨域问题
**症状**：数据加载成功，但图片不显示，控制台有 CORS 错误。

**解决方案**：
- 确保图片服务器配置了正确的 CORS 头
- 或使用代理服务器转发图片请求

### 问题 2：坐标系不匹配
**症状**：图片显示了，但 bbox 位置不对或文字位置不对。

**检查**：
- 确认 `coordX1, coordY1, coordX2, coordY2` 的值是否合理
- 检查图片的实际尺寸和坐标范围是否匹配

### 问题 3：Vue 响应式未触发
**症状**：数据已赋值但页面不更新。

**检查**：
```javascript
// 在控制台手动触发更新
$vm0.$forceUpdate()
```

### 问题 4：CSS 样式问题
**症状**：数据正确，但显示位置不对或看不见。

**检查**：
- 打开 Elements 标签，检查元素是否存在
- 检查元素的 `display`, `visibility`, `opacity` 等属性
- 检查是否被其他元素遮挡（z-index）

## 测试用例

### 测试数据转换
在控制台运行：
```javascript
const testData = {
  coordX1: 875,
  coordX2: 980,
  coordY1: 150,
  coordY2: 980,
  colId: 1,
  content: "測試文字"
}

// 应该输出: [875, 150, 980, 980]
const bbox = [testData.coordX1, testData.coordY1, testData.coordX2, testData.coordY2]
console.log(bbox)
```

### 测试文字方向判断
```javascript
// 竖排文字：高度 > 宽度 * 2
const height = 980 - 150  // 830
const width = 980 - 875   // 105
const ratio = height / width  // 约 7.9
console.log('高宽比:', ratio, ratio > 2 ? '竖排' : '横排')
```

## 下一步行动

1. **如果控制台没有任何日志**：
   - 检查 `annotationId` 是否正确传入
   - 检查 `onMounted` 生命周期是否执行

2. **如果有日志但 annotationData 为空数组**：
   - 检查 API 返回的数据结构是否符合预期
   - 检查 `result.data.annotation.columnAnnotations` 路径是否正确

3. **如果 annotationData 有数据但页面不显示**：
   - 检查图片是否加载成功（imageUrl）
   - 检查 CSS 样式是否正确应用
   - 检查是否有 JavaScript 错误阻止渲染

4. **如果一切正常但右侧信息面板为空**：
   - 检查 `structuredInfo`, `classicalTerms` 等变量是否正确赋值
   - 检查条件渲染 `v-if` 是否正确

## 快速修复

如果需要临时绕过问题，可以在组件中添加硬编码的测试数据：
```javascript
onMounted(async () => {
  // 临时测试数据
  imageUrl.value = 'https://raw.githubusercontent.com/IrreplaceL/image-bed/refs/heads/main/7e40f6ed94b14b0c9a5c379a49dbd5a5.jpg'
  annotationData.value = [
    {
      colId: 1,
      content: '測試文字',
      bbox: [875, 150, 980, 980]
    }
  ]
  structuredInfo.value = { sender: '测试发件人' }
  
  // 继续正常逻辑
  if (annotationId.value) {
    await loadExistingAnnotation(annotationId.value)
  }
})
```
