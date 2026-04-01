# BBox 坐标对齐调试指南

## 问题描述
侨批图像和 OCR 识别结果的标注框位置不对齐，bbox 没有贴合图片中的文字。

## 可能的原因

### 1. 坐标系统不匹配
后端返回的坐标可能是基于：
- 原始上传图片的尺寸（例如 3000x2000）
- 处理后图片的尺寸（例如 1024x768）
- 某个固定的标准尺寸

而前端显示的图片可能被缩放到了不同的尺寸。

### 2. 坐标顺序错误
检查坐标是 `[x1, y1, x2, y2]` 还是 `[x1, x2, y1, y2]` 格式。

## 调试步骤

### 步骤 1：查看控制台输出
打开浏览器开发者工具（F12），查看控制台，应该会看到：

```
图片加载完成，开始更新尺寸
图片尺寸信息: {
  natural: { width: 1024, height: 768 },
  display: { width: 400, height: 300 },
  scaleRatio: 0.390625
}
第一个bbox原始坐标: [875, 150, 980, 980]
缩放后坐标: {
  x: 341.796875,
  y: 58.59375,
  width: 41.015625,
  height: 324.21875
}
```

### 步骤 2：对比坐标范围
1. **检查原始坐标范围**
   - 从数据中看，coordX1=875, coordX2=980，说明X坐标范围是 0-980+
   - coordY1=150, coordY2=980，说明Y坐标范围是 150-980

2. **检查图片实际尺寸**
   - 从控制台输出看 `natural.width` 和 `natural.height`
   - 如果图片宽度只有 1000 像素，但坐标X最大到 980，这是合理的
   - 但如果图片宽度是 500 像素，坐标却到 980，说明坐标系统不匹配

### 步骤 3：计算正确的缩放比例

如果发现坐标系统不匹配，需要确定后端坐标是基于什么尺寸的。

**方法一：询问后端**
问后端开发人员，坐标是基于什么尺寸标注的。

**方法二：从数据推算**
1. 找到最右下角的bbox（最大的 coordX2 和 coordY2）
2. 假设这就是原图的大致尺寸
3. 计算：`realScaleRatio = imageDisplayWidth / 推算的原图宽度`

### 步骤 4：测试坐标顺序

在浏览器控制台手动检查坐标顺序：
```javascript
// 假设第一列在图片右侧，最后一列在左侧（竖排从右到左）
// 那么 colId=1 的 X 坐标应该最大

// 打印所有列的 X 坐标
annotationData.forEach(item => {
  console.log(`列${item.colId}: X范围 ${item.bbox[0]} - ${item.bbox[2]}`)
})

// 如果 colId=1 的 X 坐标最小，说明坐标系统可能是从左到右的
// 这与竖排文字的阅读顺序相反
```

## 常见问题和解决方案

### 问题 1：坐标基于不同的图片尺寸

**症状**：bbox 全部集中在左上角一小块区域

**解决方案**：
需要在数据加载时重新计算坐标。假设后端坐标基于 1024x768 的图片：

```javascript
const BACKEND_IMAGE_WIDTH = 1024
const BACKEND_IMAGE_HEIGHT = 768

// 在 loadExistingAnnotation 中修改坐标转换
annotationData.value = (annotation?.columnAnnotations || []).map(col => {
  // 计算相对坐标（0-1之间）
  const relX1 = col.coordX1 / BACKEND_IMAGE_WIDTH
  const relY1 = col.coordY1 / BACKEND_IMAGE_HEIGHT
  const relX2 = col.coordX2 / BACKEND_IMAGE_WIDTH
  const relY2 = col.coordY2 / BACKEND_IMAGE_HEIGHT
  
  // 转换为实际图片的绝对坐标
  return {
    ...col,
    bbox: [
      relX1 * imageWidth.value,
      relY1 * imageHeight.value,
      relX2 * imageWidth.value,
      relY2 * imageHeight.value
    ]
  }
})
```

### 问题 2：坐标顺序错误

**症状**：bbox 位置完全错乱

**解决方案**：
尝试不同的坐标顺序：

```javascript
// 原来：[coordX1, coordY1, coordX2, coordY2]
// 尝试：[coordX1, coordX2, coordY1, coordY2]
bbox: [col.coordX1, col.coordX2, col.coordY1, col.coordY2]

// 或者尝试交换 X 和 Y
bbox: [col.coordY1, col.coordX1, col.coordY2, col.coordX2]
```

### 问题 3：Y轴方向相反

**症状**：bbox 上下颠倒

**解决方案**：
```javascript
bbox: [
  col.coordX1,
  imageHeight.value - col.coordY1,  // 翻转Y坐标
  col.coordX2,
  imageHeight.value - col.coordY2
]
```

## 快速测试方案

在浏览器控制台中运行以下代码，手动绘制一个测试框：

```javascript
// 获取图片元素
const img = document.querySelector('.qiaopi-image')
console.log('图片尺寸:', img.naturalWidth, 'x', img.naturalHeight)
console.log('显示尺寸:', img.clientWidth, 'x', img.clientHeight)

// 假设要在图片右上角绘制一个 100x100 的框
const testX = img.naturalWidth - 150
const testY = 50
console.log('测试坐标:', testX, testY)

// 查看这个坐标是否接近你的第一个 bbox
```

## 需要确认的信息

请在控制台查看并提供以下信息：

1. **图片实际尺寸**：
   ```
   natural: { width: ???, height: ??? }
   ```

2. **第一个bbox的原始坐标**：
   ```
   [coordX1, coordY1, coordX2, coordY2] = [???, ???, ???, ???]
   ```

3. **第一个bbox在图片中的实际位置**：
   - 是在图片的左上角？右上角？还是其他位置？
   - 这一列的文字是第几列？（从右往左数）

4. **所有bbox的X坐标范围**：
   - 最小X坐标：???
   - 最大X坐标：???

有了这些信息，我可以准确判断坐标系统，并提供修复方案。
