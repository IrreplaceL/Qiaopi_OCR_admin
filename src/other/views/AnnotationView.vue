<template>
  <div class="annotation-container">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-title">侨批文献标注系统</div>
      <div class="toolbar-actions">
        <input
          type="file"
          ref="fileInputRef"
          @change="handleFileChange"
          accept="image/*"
          style="display: none;"
        />
        <button class="btn btn-secondary" :disabled="isUploading" @click="triggerFileUpload">
          {{ isUploading ? '识别中...' : '上传图片' }}
        </button>
        <div v-if="imageUrl" class="zoom-controls">
          <button class="btn btn-icon" @click="zoomOut" title="缩小">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M4 8a.5.5 0 0 1 .5-.5h7a.5.5 0 0 1 0 1h-7A.5.5 0 0 1 4 8z"/>
            </svg>
          </button>
          <span class="zoom-level">{{ Math.round(zoomLevel * 100) }}%</span>
          <button class="btn btn-icon" @click="zoomIn" title="放大">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
            </svg>
          </button>
          <button class="btn btn-icon" @click="resetZoom" title="重置">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z"/>
              <path d="M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z"/>
            </svg>
          </button>
        </div>
        <button class="btn btn-icon" @click="toggleFullscreen" title="全屏">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
          </svg>
        </button>
        <button class="btn btn-primary" @click="save" :disabled="!annotationData.length || isSaving">保存标注</button>
      </div>
    </header>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div v-if="isUploading || isSaving" class="loading-overlay">
        <div class="loading-card">
          <div class="loading-rings" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <p class="loading-title">{{ isSaving ? '正在保存标注' : '正在识别图片' }}</p>
          <p class="loading-sub">{{ isSaving ? '提交中，请稍候...' : '模型处理中，请稍候...' }}</p>
        </div>
      </div>

      <!-- 左侧：图像显示区 -->
      <section class="image-panel">
        <div class="panel-header">
          <h3>侨批图像</h3>
          <span class="text-direction">{{ textDirection === 'vertical' ? '竖排文字' : '横排文字' }}</span>
        </div>
        <div class="image-container"
             ref="imageContainerRef"
             @wheel="handleWheel"
             @mousedown="handleMouseDown"
             @mousemove="handleMouseMove"
             @mouseup="handleMouseUp"
             @mouseleave="handleMouseLeave"
             :class="{ dragging: isDragging }">
          <div class="image-wrapper" ref="imageWrapperRef" :style="{ transform: `scale(${zoomLevel})` }">
            <img
              v-if="imageUrl"
              :src="imageUrl"
              alt="侨批"
              class="qiaopi-image"
              ref="imageRef"
              @load="onImageLoad"
            />
            <div v-else class="upload-placeholder" @click="triggerFileUpload">
              <div class="placeholder-content">
                <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="placeholder-text">点击上传侨批图像</p>
              </div>
            </div>
            <svg
              v-if="imageLoaded"
              class="bbox-overlay"
              :width="imageDisplayWidth"
              :height="imageDisplayHeight"
              @click="handleImageClick"
            >
              <g
                v-for="item in annotationData"
                :key="item.line_id"
              >
                <rect
                  :x="item.bbox[0] * scaleRatio"
                  :y="item.bbox[1] * scaleRatio"
                  :width="(item.bbox[2] - item.bbox[0]) * scaleRatio"
                  :height="(item.bbox[3] - item.bbox[1]) * scaleRatio"
                  :class="['bbox-rect', { 'bbox-active': highlightedLineId === item.line_id }]"
                  @click.stop="handleBboxClick(item)"
                  @mouseenter="handleBboxHover(item.line_id)"
                  @mouseleave="handleBboxLeave"
                />
                <text
                  :x="item.bbox[0] * scaleRatio + 5"
                  :y="item.bbox[1] * scaleRatio + 15"
                  class="bbox-label"
                >
                  {{ item.line_id }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <!-- 右侧：标注区域 -->
      <section class="annotation-panel">
        <div class="panel-header">
          <h3>OCR识别结果</h3>
          <div class="entity-types">
            <span
              v-for="entityType in entityTypes"
              :key="entityType.type"
              class="entity-tag"
              :style="{ backgroundColor: entityType.color + '20', color: entityType.color }"
            >
              {{ entityType.label }}
            </span>
          </div>
        </div>

        <!-- 文本显示区域：使用坐标布局 -->
        <div class="text-canvas-container"
             ref="textCanvasRef"
             @wheel="handleWheel"
             @mousedown="handleTextMouseDown"
             @mousemove="handleTextMouseMove"
             @mouseup="handleTextMouseUp"
             @mouseleave="handleTextMouseLeave"
             :class="{ dragging: isTextDragging }">
          <div
            class="text-canvas-wrapper"
            :style="{
              width: imageDisplayWidth * zoomLevel + 'px',
              height: imageDisplayHeight * zoomLevel + 'px',
              transform: `scale(${zoomLevel})`,
              transformOrigin: '0 0'
            }"
          >
            <div
              v-for="item in annotationData"
              :key="item.line_id"
              :data-line-id="item.line_id"
              :class="['text-canvas-item', { 'item-active': highlightedLineId === item.line_id }]"
              :style="{
                left: item.bbox[0] * scaleRatio + 'px',
                top: item.bbox[1] * scaleRatio + 'px',
                width: (item.bbox[2] - item.bbox[0]) * scaleRatio + 'px',
                height: (item.bbox[3] - item.bbox[1]) * scaleRatio + 'px'
              }"
              @click="handleLineClick(item)"
              @mouseenter="handleLineHover(item.line_id)"
              @mouseleave="handleLineLeave"
            >
              <div class="canvas-item-content">
                <span class="item-number">{{ item.line_id }}</span>
                <div :class="['item-text', textDirection === 'vertical' ? 'vertical-text' : 'horizontal-text']">
                  <span
                    v-for="(char, index) in item.corrected_text.split('')"
                    :key="index"
                    :class="['text-char', getCharClass(item, index)]"
                    :style="getCharStyle(item, index)"
                    :title="getCharTitle(item, index)"
                  >
                    {{ char }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑面板 -->
        <div v-if="selectedLine" class="edit-panel">
          <div class="edit-header">
            <h4>编辑第 {{ selectedLine.line_id }} 行</h4>
            <button class="btn-close" @click="selectedLine = null">×</button>
          </div>
          <div class="edit-body">
            <div class="form-group">
              <label>OCR原文：</label>
              <div class="text-display">{{ selectedLine.ocr_text }}</div>
            </div>
            <div class="form-group">
              <label>校正文本：</label>
              <input
                v-model="selectedLine.corrected_text"
                class="form-control"
                @input="updateText"
              />
            </div>
            <div class="form-group">
              <label>识别置信度：</label>
              <div class="confidence-wrap">
                <div class="confidence-track">
                  <div
                    class="confidence-fill"
                    :style="{
                      width: (selectedLine.score * 100).toFixed(1) + '%',
                      background: confidenceColor(selectedLine.score)
                    }"
                  ></div>
                </div>
                <span class="confidence-value">{{ (selectedLine.score * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useUserStoreHook } from '@/store/modules/user'
import { entityTypes } from '../mockData1.js'
import { processImage, saveAnnotation, getAnnotationDetail } from '../http/api.js'

// 响应式数据
const annotationData = ref([])
const selectedLine = ref(null)
const highlightedLineId = ref(null)
const imageRef = ref(null)
const imageWrapperRef = ref(null)
const imageContainerRef = ref(null)
const textListRef = ref(null)
const textCanvasRef = ref(null)
const fileInputRef = ref(null)
const imageLoaded = ref(false)
const imageWidth = ref(0)
const imageHeight = ref(0)
const imageDisplayWidth = ref(0)
const imageDisplayHeight = ref(0)
const scaleRatio = ref(1)
const imageUrl = ref('')
const isUploading = ref(false)
const isSaving = ref(false)
const rawData = ref(null)
const zoomLevel = ref(1)
const isFullscreen = ref(false)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })
const isTextDragging = ref(false)
const textDragStart = ref({ x: 0, y: 0 })
const textScrollStart = ref({ x: 0, y: 0 })
const route = useRoute()
const userStore = useUserStoreHook()

const projectId = computed(() => route.params.projectId)
const userId = computed(() => userStore.userId)
const annotationId = computed(() => route.params.annotationId)

// 计算属性：判断文字方向
const textDirection = computed(() => {
  if (annotationData.value.length === 0) return 'vertical'

  let verticalCount = 0
  let horizontalCount = 0

  annotationData.value.forEach(item => {
    if (item.bbox) {
      const width = item.bbox[2] - item.bbox[0]
      const height = item.bbox[3] - item.bbox[1]
      const ratio = height / width

      if (ratio > 2) {
        verticalCount++
      } else {
        horizontalCount++
      }
    }
  })

  return verticalCount > horizontalCount ? 'vertical' : 'horizontal'
})

// 文件上传相关
const triggerFileUpload = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  if (!file.type.startsWith('image/')) {
    alert('请选择图片文件')
    return
  }

  imageUrl.value = URL.createObjectURL(file)
  imageLoaded.value = false
  annotationData.value = []
  selectedLine.value = null
  highlightedLineId.value = null

  await uploadAndProcess(file)
  event.target.value = ''
}

const uploadAndProcess = async (file) => {
  isUploading.value = true

  try {
    if (!projectId.value || !userId.value) {
      throw new Error('缺少 projectId 或 userId，无法发起 OCR 请求')
    }

    const result = await processImage(file, {
      projectId: projectId.value,
      userId: userId.value
    })

    annotationData.value = result.annotationData || []
    rawData.value = result.rawData || null
    if (result.imageUrl) {
      imageUrl.value = result.imageUrl
    }

    console.log('标注数据加载成功：', annotationData.value)
  } catch (error) {
    console.error('上传处理失败：', error)
    alert(`上传处理失败：${error.message}`)
    imageUrl.value = ''
    annotationData.value = []
  } finally {
    isUploading.value = false
  }
}

// 图片加载相关
const onImageLoad = () => {
  if (imageRef.value) {
    updateImageDimensions()
  }
}

const updateImageDimensions = () => {
  if (imageRef.value) {
    const naturalWidth = imageRef.value.naturalWidth
    const naturalHeight = imageRef.value.naturalHeight
    const displayWidth = imageRef.value.clientWidth
    const displayHeight = imageRef.value.clientHeight

    imageWidth.value = naturalWidth
    imageHeight.value = naturalHeight
    imageDisplayWidth.value = displayWidth
    imageDisplayHeight.value = displayHeight
    scaleRatio.value = displayWidth / naturalWidth
    imageLoaded.value = true
  }
}

// 实体标注相关
const getEntityForChar = (item, index) => {
  return item.entities.find(entity =>
    index >= entity.start && index < entity.end
  )
}

const getCharClass = (item, index) => {
  const entity = getEntityForChar(item, index)
  return entity ? 'highlighted' : ''
}

const getCharStyle = (item, index) => {
  const entity = getEntityForChar(item, index)
  if (entity) {
    const color = getEntityColor(entity.type)
    return {
      backgroundColor: color + '30',
      borderLeftColor: textDirection.value === 'vertical' ? color : 'transparent',
      borderTopColor: textDirection.value === 'horizontal' ? color : 'transparent'
    }
  }
  return {}
}

const getCharTitle = (item, index) => {
  const entity = getEntityForChar(item, index)
  if (entity) {
    const type = entityTypes.find(t => t.type === entity.type)
    return `${type?.label}: ${entity.text}`
  }
  return ''
}

const getEntityColor = (type) => {
  const entityType = entityTypes.find(t => t.type === type)
  return entityType?.color || '#999'
}

// 交互事件处理
const handleBboxClick = (item) => {
  selectedLine.value = item
  highlightedLineId.value = item.line_id
  scrollToLine(item.line_id)
}

const handleLineClick = (item) => {
  selectedLine.value = item
  highlightedLineId.value = item.line_id
}

const handleBboxHover = (lineId) => {
  if (!selectedLine.value) {
    highlightedLineId.value = lineId
  }
}

const handleBboxLeave = () => {
  if (!selectedLine.value) {
    highlightedLineId.value = null
  }
}

const handleLineHover = (lineId) => {
  if (!selectedLine.value) {
    highlightedLineId.value = lineId
  }
}

const handleLineLeave = () => {
  if (!selectedLine.value) {
    highlightedLineId.value = null
  }
}

const handleImageClick = () => {
  // 点击空白区域不做处理
}

const scrollToLine = (lineId) => {
  nextTick(() => {
    if (textCanvasRef.value) {
      const lineElement = textCanvasRef.value.querySelector(`[data-line-id="${lineId}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
}

// 缩放控制
const zoomIn = () => {
  if (zoomLevel.value < 3) {
    zoomLevel.value = Math.min(3, zoomLevel.value + 0.25)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.5) {
    zoomLevel.value = Math.max(0.5, zoomLevel.value - 0.25)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// 鼠标滚轮缩放
const handleWheel = (event) => {
  if (!imageUrl.value) return

  event.preventDefault()

  const delta = -event.deltaY / 1000
  const newZoom = zoomLevel.value + delta

  // 限制缩放范围
  zoomLevel.value = Math.max(0.5, Math.min(3, newZoom))
}

// 鼠标拖动功能
const handleMouseDown = (event) => {
  if (!imageUrl.value || event.button !== 0) return

  isDragging.value = true
  dragStart.value = {
    x: event.clientX,
    y: event.clientY
  }

  if (imageContainerRef.value) {
    scrollStart.value = {
      x: imageContainerRef.value.scrollLeft,
      y: imageContainerRef.value.scrollTop
    }
  }
}

const handleMouseMove = (event) => {
  if (!isDragging.value || !imageContainerRef.value) return

  const deltaX = dragStart.value.x - event.clientX
  const deltaY = dragStart.value.y - event.clientY

  imageContainerRef.value.scrollLeft = scrollStart.value.x + deltaX
  imageContainerRef.value.scrollTop = scrollStart.value.y + deltaY
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handleMouseLeave = () => {
  isDragging.value = false
}

// 右侧文本区域拖动功能
const handleTextMouseDown = (event) => {
  if (event.button !== 0) return

  // 如果点击的是文本项，不启动拖动
  if (event.target.closest('.text-canvas-item')) return

  isTextDragging.value = true
  textDragStart.value = {
    x: event.clientX,
    y: event.clientY
  }

  if (textCanvasRef.value) {
    textScrollStart.value = {
      x: textCanvasRef.value.scrollLeft,
      y: textCanvasRef.value.scrollTop
    }
  }
}

const handleTextMouseMove = (event) => {
  if (!isTextDragging.value || !textCanvasRef.value) return

  const deltaX = textDragStart.value.x - event.clientX
  const deltaY = textDragStart.value.y - event.clientY

  textCanvasRef.value.scrollLeft = textScrollStart.value.x + deltaX
  textCanvasRef.value.scrollTop = textScrollStart.value.y + deltaY
}

const handleTextMouseUp = () => {
  isTextDragging.value = false
}

const handleTextMouseLeave = () => {
  isTextDragging.value = false
}

// 全屏控制
const toggleFullscreen = async () => {
  const container = document.querySelector('.annotation-container')

  if (!document.fullscreenElement) {
    try {
      await container.requestFullscreen()
      isFullscreen.value = true
    } catch (err) {
      console.error('无法进入全屏模式:', err)
    }
  } else {
    try {
      await document.exitFullscreen()
      isFullscreen.value = false
    } catch (err) {
      console.error('无法退出全屏模式:', err)
    }
  }
}

// 编辑功能
const updateText = () => {
  // 文本更新会实时反映在标注数据中
}

const confidenceColor = (score) => {
  if (score >= 0.9) return '#10b981'
  if (score >= 0.7) return '#f59e0b'
  return '#ef4444'
}

const save = async () => {
  if (!rawData.value?.id) {
    alert('无法获取标注 ID，请重新加载页面')
    return
  }
  isSaving.value = true
  try {
    await saveAnnotation(annotationData.value, {
      annotationId: rawData.value.id,
      annotatorId: userId.value,
      ocrRawJson: rawData.value.ocrRawJson
    })
    alert('标注结果已保存')
  } catch (error) {
    alert('保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 加载已有标注详情
const loadExistingAnnotation = async (id) => {
  isUploading.value = true
  try {
    const result = await getAnnotationDetail(id)
    annotationData.value = result.annotationData || []
    rawData.value = result.rawData || null
    if (result.imageUrl) {
      imageUrl.value = result.imageUrl
    }
    console.log('已有标注数据加载成功：', annotationData.value)
  } catch (error) {
    console.error('加载标注详情失败：', error)
    alert(`加载标注失败：${error.message}`)
  } finally {
    isUploading.value = false
  }
}

// 生命周期
onMounted(async () => {
  window.addEventListener('resize', () => {
    if (imageLoaded.value) {
      updateImageDimensions()
    }
  })

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  // 若携带 annotationId，加载已有标注数据
  if (annotationId.value) {
    await loadExistingAnnotation(annotationId.value)
  }
})
</script>

<style scoped src="../styles/annotation.css"></style>

