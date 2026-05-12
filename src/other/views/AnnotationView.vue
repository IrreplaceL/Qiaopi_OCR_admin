<template>
  <div ref="annotationContainerRef" class="annotation-container">
    <!-- 顶部工具栏 -->
    <header class="toolbar">
      <div class="toolbar-title">
        <span class="toolbar-kicker">Qiaopi Archive</span>
        <strong>侨批文献对照标注工作台</strong>
      </div>
      <div class="toolbar-actions">
        <input
          v-if="!isDetailMode"
          type="file"
          ref="fileInputRef"
          @change="handleFileChange"
          accept="image/*"
          style="display: none;"
        />
        <button
          v-if="!isDetailMode"
          class="btn btn-ghost"
          :disabled="isUploading"
          @click="triggerFileUpload"
        >
          {{ isUploading ? '识别中...' : '上传图像' }}
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
        <button
          v-if="isDetailMode"
          class="btn btn-icon"
          :disabled="!hasPrev || isUploading || isSaving"
          @click="goToPrevAnnotation"
          :title="hasPrev ? '上一条标注' : '已是第一条'"
        >
          {{ hasPrev ? '上一条' : '已是第一条' }}
        </button>
        <button
          v-if="isDetailMode"
          class="btn btn-icon"
          :disabled="!hasNext || isUploading || isSaving"
          @click="goToNextAnnotation"
          :title="hasNext ? '下一条标注' : '已是最后一条'"
        >
          {{ hasNext ? '下一条' : '已是最后一条' }}
        </button>
        <button
          v-if="isDetailMode"
          class="btn btn-ghost"
          @click="backToProjectList"
          title="返回项目标注列表"
        >
          返回列表
        </button>
        <button class="btn btn-icon" @click="toggleFullscreen" title="全屏">
          <svg width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
            <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
          </svg>
        </button>
          <button
            v-if="isDetailMode && imageLoaded"
            class="btn btn-ghost"
            :disabled="isSaving"
            @click="addAnnotationBox"
          >
            新增框
          </button>
        <button class="btn btn-ghost theme-toggle" @click="toggleTheme">{{ themeLabel }}</button>
        <button class="btn btn-primary" @click="openSaveConfirm" :disabled="!annotationData.length || isSaving">保存标注</button>
      </div>
    </header>

    <!-- 三栏主内容区域 -->
    <main class="main-content-three-columns">
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
      <section class="image-panel column-left">
        <div class="panel-header">
          <h3>侨批图像</h3>
          <span class="text-direction">{{ textDirection === 'vertical' ? '竖排文字' : '横排文字' }}</span>
        </div>
        <div class="image-container"
             ref="imageContainerRef"
             @wheel="handleWheel"
             @scroll="handleImageScroll"
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
            <div
              v-else
              class="upload-placeholder"
              :class="{ disabled: isDetailMode }"
              @click="!isDetailMode && triggerFileUpload()"
            >
              <div class="placeholder-content">
                <svg class="placeholder-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                </svg>
                <p class="placeholder-text">
                  {{ isDetailMode ? '当前标注缺少图像，无法重新上传' : '点击上传侨批图像' }}
                </p>
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
                :key="item.__clientKey || item.id || item.colId"
              >
                <rect
                  :x="getDisplayRect(item).x"
                  :y="getDisplayRect(item).y"
                  :width="getDisplayRect(item).width"
                  :height="getDisplayRect(item).height"
                  :class="['bbox-rect', getBoxColorClass(item.colId), { 'bbox-active': highlightedLineId === item.colId }]"
                  @click.stop="handleBboxClick(item)"
                  @mousedown.stop.prevent="startBoxDrag($event, item)"
                  @mouseenter="handleBboxHover(item.colId)"
                  @mouseleave="handleBboxLeave"
                />
                <rect
                  v-for="handle in getResizeHandles(item)"
                  v-show="highlightedLineId === item.colId"
                  :key="`${item.colId}-${handle.name}`"
                  :x="handle.x"
                  :y="handle.y"
                  :width="handle.size"
                  :height="handle.size"
                  :class="['bbox-handle', `handle-${handle.name}`]"
                  @mousedown.stop.prevent="startBoxResize($event, item, handle.name)"
                />
                <text
                  :x="getDisplayRect(item).x + 5"
                  :y="getDisplayRect(item).y + 15"
                  class="bbox-label"
                >
                  {{ item.colId }}
                </text>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <!-- 右侧：标注区域 -->
      <section class="annotation-panel column-middle">
        <div class="panel-header">
          <h3>标注区</h3>
          <span class="text-direction">{{ textDirection === 'vertical' ? '竖排文字' : '横排文字' }}</span>
        </div>

        <!-- 文本显示区域：使用坐标布局 -->
        <div class="text-canvas-container"
             ref="textCanvasRef"
             @wheel="handleWheel"
             @scroll="handleTextScroll"
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
              :key="item.__clientKey || item.id || item.colId"
              :data-line-id="item.colId"
              :class="['text-canvas-item', getBoxColorClass(item.colId), { 'item-active': highlightedLineId === item.colId }]"
              :style="{
                left: getDisplayRect(item).x + 'px',
                top: getDisplayRect(item).y + 'px',
                width: getDisplayRect(item).width + 'px',
                height: getDisplayRect(item).height + 'px'
              }"
              @click="handleLineClick(item)"
              @mouseenter="handleLineHover(item.colId)"
              @mouseleave="handleLineLeave"
            >
              <div class="canvas-item-content">
                <span class="item-number">{{ item.colId }}</span>
                <div
                  :class="['item-text', textDirection === 'vertical' ? 'vertical-text' : 'horizontal-text']"
                  :style="{ fontSize: getTextFontSize(item) }"
                >
                  {{ getPreferredText(item) }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 编辑面板 -->
        <div v-if="selectedLine" class="edit-panel" :style="editPanelStyle">
          <div class="edit-header" @mousedown="startEditPanelDrag">
            <h4>编辑第 {{ selectedLine.colId }} 列</h4>
            <button class="btn-close" @mousedown.stop @click="closeEditPanel">×</button>
          </div>
          <div class="edit-body">
            <div class="form-group">
              <label>OCR原文：</label>
              <div class="text-display">{{ selectedLine.content }}</div>
            </div>
            <div class="form-group">
              <label>校正文本：</label>
              <input
                v-model="selectedLine.contentChange"
                class="form-control"
                @input="updateText"
              />
            </div>
            <div class="form-group">
              <label>不确定说明：</label>
              <textarea
                v-model="selectedLine.uncertainNote"
                class="form-control"
                rows="2"
                placeholder="如有不确定的字或内容，请在此说明"
              ></textarea>
            </div>
            <div class="form-group">
              <label>坐标信息：</label>
              <div class="text-display">
                X: {{ formatCoord(selectedLine.bbox[0]) }} - {{ formatCoord(selectedLine.bbox[2]) }},
                Y: {{ formatCoord(selectedLine.bbox[1]) }} - {{ formatCoord(selectedLine.bbox[3]) }}
              </div>
            </div>
            <button class="btn btn-danger full-width" @click="deleteSelectedBox">删除此列</button>
          </div>
        </div>
      </section>

      <!-- 右侧：结构化信息面板 -->
      <section :class="['info-panel', 'column-right', { collapsed: isInfoCollapsed }]">
        <div class="panel-header">
          <h3>结构化信息</h3>
          <button class="btn-collapse" @click="isInfoCollapsed = !isInfoCollapsed">
            {{ isInfoCollapsed ? '展开' : '收起' }}
          </button>
        </div>

        <div v-show="!isInfoCollapsed" class="info-tabs" role="tablist">
          <button
            v-for="tab in infoTabs"
            :key="tab.key"
            type="button"
            :class="['info-tab', { active: activeInfoTab === tab.key }]"
            @click="activeInfoTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <div v-show="!isInfoCollapsed" :class="['info-content', `tab-${activeInfoTab}`]" @wheel.stop>
          <div class="info-section ocr-current-section">
            <div class="section-title">当前列校注</div>
            <template v-if="selectedLine">
              <div class="info-item">
                <span class="info-label">列号</span>
                <span class="info-value">第 {{ selectedLine.colId }} 列</span>
              </div>
              <div class="info-item stacked">
                <span class="info-label">OCR 原文</span>
                <span class="info-value serif">{{ selectedLine.content || selectedLine.ocr_text || '未识别' }}</span>
              </div>
              <div class="info-item stacked">
                <span class="info-label">校正文本</span>
                <span class="info-value serif">{{ getPreferredText(selectedLine) || '未校正' }}</span>
              </div>
            </template>
            <div v-else class="empty-hint">选择任一列后查看 OCR 对照</div>
          </div>

          <div v-if="structuredInfo" class="info-section metadata-section">
            <div class="section-title">基础元数据</div>
            <div class="info-form-grid">
              <label class="info-field">
                <span>寄件人</span>
                <input v-model="structuredInfo.sender" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field">
                <span>收件人</span>
                <input v-model="structuredInfo.receiver" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field">
                <span>寄件地</span>
                <input v-model="structuredInfo.sendPlace" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field">
                <span>收件地</span>
                <input v-model="structuredInfo.receivePlace" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field">
                <span>原文日期</span>
                <input v-model="structuredInfo.originalDate" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field">
                <span>公历日期</span>
                <input v-model="structuredInfo.gregorianDate" class="form-control compact" placeholder="未提取" />
              </label>
              <label class="info-field full">
                <span>侨汇信息</span>
                <textarea v-model="structuredInfo.remittanceInfo" class="form-control compact" rows="2" placeholder="未提取"></textarea>
              </label>
            </div>
          </div>

          <div v-if="structuredInfo" class="info-section summary-section">
            <div class="section-title">核心内容摘要</div>
            <textarea v-model="structuredInfo.coreEvent" class="form-control compact" rows="4" placeholder="请输入核心内容摘要"></textarea>
          </div>

          <div class="info-section classical-section">
            <div class="section-title with-action">
              <span>文言词汇解释</span>
              <button class="btn btn-mini" @click="addClassicalTerm">新增</button>
            </div>
            <div v-if="!classicalTerms.length" class="empty-hint">暂无词汇解释</div>
            <div v-for="(term, index) in classicalTerms" :key="getEditableKey(term, index, 'term')" class="editable-list-item">
              <input v-model="term.term" class="form-control compact" placeholder="词汇" />
              <textarea v-model="term.explanation" class="form-control compact" rows="2" placeholder="解释"></textarea>
              <button class="btn btn-danger btn-mini" @click="removeClassicalTerm(index)">删除</button>
            </div>
          </div>

          <div class="info-section dialect-section">
            <div class="section-title with-action">
              <span>方言俗字注释</span>
              <button class="btn btn-mini" @click="addDialectNote">新增</button>
            </div>
            <div v-if="!dialectNotes.length" class="empty-hint">暂无方言注释</div>
            <div v-for="(note, index) in dialectNotes" :key="getEditableKey(note, index, 'dialect')" class="editable-list-item">
              <input v-model="note.original" class="form-control compact" placeholder="原词" />
              <textarea v-model="note.note" class="form-control compact" rows="2" placeholder="注释"></textarea>
              <button class="btn btn-danger btn-mini" @click="removeDialectNote(index)">删除</button>
            </div>
          </div>

          <div class="info-section warning-section review-section">
            <div class="section-title with-action">
              <span>需要人工复核</span>
              <button class="btn btn-mini" @click="addNeedReviewItem">新增</button>
            </div>
            <div v-if="!needReviewItems.length" class="empty-hint">暂无复核项</div>
            <div v-for="(item, index) in needReviewItems" :key="getEditableKey(item, index, 'review')" class="editable-list-item">
              <textarea v-model="item.item" class="form-control compact" rows="2" placeholder="复核项"></textarea>
              <button class="btn btn-danger btn-mini" @click="removeNeedReviewItem(index)">删除</button>
            </div>
          </div>
          <template v-if="false">
          <!-- 基础信息 -->
          <div v-if="structuredInfo" class="info-section">
            <div class="section-title">📋 基础元数据</div>
            <div class="info-item">
              <span class="info-label">寄件人：</span>
              <span class="info-value">{{ structuredInfo.sender || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">收件人：</span>
              <span class="info-value">{{ structuredInfo.receiver || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">寄件地：</span>
              <span class="info-value">{{ structuredInfo.sendPlace || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">收件地：</span>
              <span class="info-value">{{ structuredInfo.receivePlace || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">原文日期：</span>
              <span class="info-value">{{ structuredInfo.originalDate || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">公历日期：</span>
              <span class="info-value">{{ structuredInfo.gregorianDate || '未提及' }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">侨汇信息：</span>
              <span class="info-value">{{ structuredInfo.remittanceInfo || '未提及' }}</span>
            </div>
          </div>

          <!-- 核心事件 -->
          <div v-if="structuredInfo?.coreEvent" class="info-section">
            <div class="section-title">📝 核心内容摘要</div>
            <div class="info-text">{{ structuredInfo.coreEvent }}</div>
          </div>

          <!-- 文言词汇解释 -->
          <div v-if="classicalTerms?.length" class="info-section">
            <div class="section-title">📖 文言词汇解释</div>
            <div v-for="term in classicalTerms" :key="term.id" class="term-item">
              <span class="term-word">{{ term.term }}</span>
              <span class="term-explanation">{{ term.explanation }}</span>
            </div>
          </div>

          <!-- 方言注释 -->
          <div v-if="dialectNotes?.length" class="info-section">
            <div class="section-title">🗣️ 方言俗字注释</div>
            <div v-for="note in dialectNotes" :key="note.id" class="dialect-item">
              <span class="dialect-word">{{ note.original }}</span>
              <span class="dialect-note">{{ note.note }}</span>
            </div>
          </div>

          <!-- 需要复核的项目 -->
          <div v-if="needReviewItems?.length" class="info-section warning-section">
            <div class="section-title">⚠️ 需要人工复核</div>
            <div v-for="item in needReviewItems" :key="item.id" class="review-item">
              {{ item.item }}
            </div>
          </div>

          <!-- 置信度信息 -->
          </template>
          <div v-if="structuredInfo?.confidence" class="info-section confidence-section">
            <div class="section-title">📊 识别置信度</div>
            <div class="confidence-wrap">
              <div class="confidence-track">
                <div
                  class="confidence-fill"
                  :style="{
                    width: (structuredInfo.confidence * 100) + '%',
                    background: confidenceColor(structuredInfo.confidence)
                  }"
                ></div>
              </div>
              <span class="confidence-value">{{ (structuredInfo.confidence * 100).toFixed(1) }}%</span>
            </div>
            <div v-if="structuredInfo.confidenceCalculation" class="info-text small">
              {{ structuredInfo.confidenceCalculation }}
            </div>
          </div>

          <!-- Token 使用情况 -->
          <div v-if="tokenUsage" class="info-section token-section">
            <div class="section-title">💰 Token 使用情况</div>
            <div class="info-item">
              <span class="info-label">提示词：</span>
              <span class="info-value">{{ tokenUsage.promptTokens }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">生成内容：</span>
              <span class="info-value">{{ tokenUsage.completionTokens }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">总计：</span>
              <span class="info-value">{{ tokenUsage.totalTokens }}</span>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div v-if="showSaveDialog" class="save-confirm-overlay" @click.self="closeSaveConfirm">
      <div class="save-confirm-dialog" role="dialog" aria-modal="true" aria-label="保存标注确认">
        <h4>确认保存标注</h4>
        <p>将保存当前校正结果，是否继续？</p>
        <div class="save-confirm-actions">
          <button class="btn btn-icon" :disabled="isSaving" @click="closeSaveConfirm">取消</button>
          <button class="btn btn-primary" :disabled="isSaving" @click="save">{{ isSaving ? '保存中...' : '确认保存' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStoreHook } from '@/store/modules/user'
import { useTheme } from '@/utils/theme'
import { READONLY_MESSAGE, assertWritable } from '@/utils/permission'
import {
  processImage,
  saveAnnotation,
  getAnnotationDetail,
  getAnnotationListByProject
} from '../http/api.js'

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
const showSaveDialog = ref(false)
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })
const scrollStart = ref({ x: 0, y: 0 })
const isTextDragging = ref(false)
const textDragStart = ref({ x: 0, y: 0 })
const textScrollStart = ref({ x: 0, y: 0 })
const annotationContainerRef = ref(null)
const annotationOrder = ref([])
const route = useRoute()
const router = useRouter()
const userStore = useUserStoreHook()
const { themeLabel, toggleTheme } = useTheme()

// 新增：结构化信息
const structuredInfo = ref(null)
const classicalTerms = ref([])
const dialectNotes = ref([])
const needReviewItems = ref([])
const tokenUsage = ref(null)
const activeInfoTab = ref('ocr')
const isInfoCollapsed = ref(false)
const syncingScroll = ref(false)
const activeBoxEdit = ref(null)
const editPanelPosition = ref(null)
const editPanelDrag = ref(null)
const COORD_SYSTEM_SIZE = 1000
const MIN_BOX_SIZE = 12
const infoTabs = [
  { key: 'ocr', label: 'OCR' },
  { key: 'structured', label: '结构化' },
  { key: 'dialect', label: '方言注释' },
  { key: 'ai', label: 'AI建议' }
]

const projectId = computed(() => route.params.projectId)
const userId = computed(() => userStore.userId)
const currentUser = computed(() => ({
  id: userStore.userId,
  role: userStore.role
}))
const annotationId = computed(() => route.params.annotationId)
const isDetailMode = computed(() => Boolean(annotationId.value))
const currentAnnotationIndex = computed(() => {
  const currentId = String(annotationId.value || '')
  return annotationOrder.value.findIndex(item => String(item.id) === currentId)
})
const hasPrev = computed(() => currentAnnotationIndex.value > 0)
const hasNext = computed(
  () =>
    currentAnnotationIndex.value > -1 &&
    currentAnnotationIndex.value < annotationOrder.value.length - 1
)
const editPanelStyle = computed(() => {
  if (!editPanelPosition.value) return {}

  return {
    left: `${editPanelPosition.value.x}px`,
    top: `${editPanelPosition.value.y}px`,
    right: 'auto'
  }
})

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

// 计算文字的字体大小（基于框的大小和字数）
const getTextFontSize = (item) => {
  if (!item.bbox) return '12px'

  const width = (item.bbox[2] - item.bbox[0]) * scaleRatio.value
  const height = (item.bbox[3] - item.bbox[1]) * scaleRatio.value
  const charCount = Math.max(1, getPreferredText(item).length)

  if (textDirection.value === 'vertical') {
    // 竖排文字：宽度决定字体大小，高度决定能放几个字
    // 字体大小 = 框宽度 * 0.7（留一些边距）
    // 但不能超过 (框高度 * 0.85) / 字数
    const maxByWidth = width * 0.7
    const maxByHeight = (height * 0.85) / charCount
    return Math.max(6, Math.min(maxByWidth, maxByHeight, 20)) + 'px'
  } else {
    // 横排文字：高度决定字体大小，宽度决定能放几个字
    const maxByHeight = height * 0.7
    const maxByWidth = (width * 0.85) / charCount
    return Math.max(6, Math.min(maxByHeight, maxByWidth, 20)) + 'px'
  }
}

const firstNonBlankText = (...values) => {
  const value = values.find(item => typeof item === 'string' && item.trim().length > 0)
  return value ?? ''
}

const getPreferredText = (item) => {
  return firstNonBlankText(item.contentChange, item.corrected_text, item.content, item.ocr_text)
}

const getBoxColorClass = (colId) => {
  const idx = (Number(colId) - 1) % 4
  return ['tone-blue', 'tone-green', 'tone-purple', 'tone-yellow'][idx]
}

const getDisplayRect = (item) => {
  const x1 = item.bbox[0]
  const y1 = item.bbox[1]
  const x2 = item.bbox[2]
  const y2 = item.bbox[3]

  const baseX = x1 * scaleRatio.value
  const baseY = y1 * scaleRatio.value
  const baseW = (x2 - x1) * scaleRatio.value
  const baseH = (y2 - y1) * scaleRatio.value

  // 视觉上留一点缝隙，避免框贴得太死
  const gap = Math.max(1, Math.min(3, baseW * 0.06))

  return {
    x: baseX + gap / 2,
    y: baseY + gap / 2,
    width: Math.max(2, baseW - gap),
    height: Math.max(2, baseH - gap)
  }
}

const formatCoord = (value) => Math.round(Number(value || 0))

const clamp = (value, min, max) => Math.min(max, Math.max(min, value))

const clampEditPanelPosition = (x, y, width = 350, height = 420) => {
  const margin = 8
  const maxX = Math.max(margin, window.innerWidth - width - margin)
  const maxY = Math.max(margin, window.innerHeight - height - margin)

  return {
    x: clamp(x, margin, maxX),
    y: clamp(y, margin, maxY)
  }
}

const normalizeBbox = (bbox) => {
  let x1 = clamp(Math.min(bbox[0], bbox[2]), 0, imageWidth.value)
  let y1 = clamp(Math.min(bbox[1], bbox[3]), 0, imageHeight.value)
  let x2 = clamp(Math.max(bbox[0], bbox[2]), 0, imageWidth.value)
  let y2 = clamp(Math.max(bbox[1], bbox[3]), 0, imageHeight.value)

  if (x2 - x1 < MIN_BOX_SIZE) {
    if (x1 + MIN_BOX_SIZE <= imageWidth.value) {
      x2 = x1 + MIN_BOX_SIZE
    } else {
      x1 = Math.max(0, x2 - MIN_BOX_SIZE)
    }
  }
  if (y2 - y1 < MIN_BOX_SIZE) {
    if (y1 + MIN_BOX_SIZE <= imageHeight.value) {
      y2 = y1 + MIN_BOX_SIZE
    } else {
      y1 = Math.max(0, y2 - MIN_BOX_SIZE)
    }
  }

  return [x1, y1, x2, y2]
}

const setItemBbox = (item, bbox) => {
  item.bbox = normalizeBbox(bbox)
  item.relativeCoords = [
    imageWidth.value ? item.bbox[0] / imageWidth.value : 0,
    imageHeight.value ? item.bbox[1] / imageHeight.value : 0,
    imageWidth.value ? item.bbox[2] / imageWidth.value : 0,
    imageHeight.value ? item.bbox[3] / imageHeight.value : 0
  ]
}

const ensureColumnClientKey = (item) => {
  if (!item.__clientKey) {
    item.__clientKey = `column-${item.id ?? 'new'}-${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
  return item.__clientKey
}

const getResizeHandles = (item) => {
  const rect = getDisplayRect(item)
  const size = Math.max(8, Math.min(12, 10 / zoomLevel.value))
  const half = size / 2
  const midX = rect.x + rect.width / 2
  const midY = rect.y + rect.height / 2
  const right = rect.x + rect.width
  const bottom = rect.y + rect.height

  return [
    { name: 'nw', x: rect.x - half, y: rect.y - half, size },
    { name: 'n', x: midX - half, y: rect.y - half, size },
    { name: 'ne', x: right - half, y: rect.y - half, size },
    { name: 'e', x: right - half, y: midY - half, size },
    { name: 'se', x: right - half, y: bottom - half, size },
    { name: 's', x: midX - half, y: bottom - half, size },
    { name: 'sw', x: rect.x - half, y: bottom - half, size },
    { name: 'w', x: rect.x - half, y: midY - half, size }
  ]
}

const getPointerImagePoint = (event) => {
  const overlay = imageWrapperRef.value?.querySelector('.bbox-overlay')
  if (!overlay) return null

  const rect = overlay.getBoundingClientRect()
  const displayX = (event.clientX - rect.left) / zoomLevel.value
  const displayY = (event.clientY - rect.top) / zoomLevel.value

  return {
    x: displayX / scaleRatio.value,
    y: displayY / scaleRatio.value
  }
}

const stopBoxEdit = () => {
  activeBoxEdit.value = null
  window.removeEventListener('mousemove', handleBoxEditMove)
  window.removeEventListener('mouseup', stopBoxEdit)
}

const handleEditPanelDrag = (event) => {
  if (!editPanelDrag.value) return

  const { offsetX, offsetY, width, height } = editPanelDrag.value
  editPanelPosition.value = clampEditPanelPosition(
    event.clientX - offsetX,
    event.clientY - offsetY,
    width,
    height
  )
}

const stopEditPanelDrag = () => {
  editPanelDrag.value = null
  window.removeEventListener('mousemove', handleEditPanelDrag)
  window.removeEventListener('mouseup', stopEditPanelDrag)
}

const startEditPanelDrag = (event) => {
  if (event.button !== 0) return
  if (event.target?.closest?.('button,input,textarea,select')) return

  const panel = event.target?.closest?.('.edit-panel')
  if (!panel) return

  const rect = panel.getBoundingClientRect()
  editPanelPosition.value = { x: rect.left, y: rect.top }
  editPanelDrag.value = {
    offsetX: event.clientX - rect.left,
    offsetY: event.clientY - rect.top,
    width: rect.width,
    height: rect.height
  }

  window.addEventListener('mousemove', handleEditPanelDrag)
  window.addEventListener('mouseup', stopEditPanelDrag)
  event.preventDefault()
}

const closeEditPanel = () => {
  stopEditPanelDrag()
  selectedLine.value = null
}

const startBoxDrag = (event, item) => {
  if (!imageLoaded.value) return
  const point = getPointerImagePoint(event)
  if (!point) return

  selectedLine.value = item
  highlightedLineId.value = item.colId
  activeBoxEdit.value = {
    mode: 'move',
    item,
    startPoint: point,
    startBbox: [...item.bbox]
  }
  window.addEventListener('mousemove', handleBoxEditMove)
  window.addEventListener('mouseup', stopBoxEdit)
}

const startBoxResize = (event, item, handle) => {
  if (!imageLoaded.value) return
  const point = getPointerImagePoint(event)
  if (!point) return

  selectedLine.value = item
  highlightedLineId.value = item.colId
  activeBoxEdit.value = {
    mode: 'resize',
    handle,
    item,
    startPoint: point,
    startBbox: [...item.bbox]
  }
  window.addEventListener('mousemove', handleBoxEditMove)
  window.addEventListener('mouseup', stopBoxEdit)
}

const handleBoxEditMove = (event) => {
  const edit = activeBoxEdit.value
  if (!edit) return

  const point = getPointerImagePoint(event)
  if (!point) return

  const dx = point.x - edit.startPoint.x
  const dy = point.y - edit.startPoint.y
  const [x1, y1, x2, y2] = edit.startBbox
  let next = [x1, y1, x2, y2]

  if (edit.mode === 'move') {
    next = [x1 + dx, y1 + dy, x2 + dx, y2 + dy]
    const width = x2 - x1
    const height = y2 - y1
    next[0] = clamp(next[0], 0, imageWidth.value - width)
    next[1] = clamp(next[1], 0, imageHeight.value - height)
    next[2] = next[0] + width
    next[3] = next[1] + height
  } else {
    if (edit.handle.includes('w')) next[0] = x1 + dx
    if (edit.handle.includes('e')) next[2] = x2 + dx
    if (edit.handle.includes('n')) next[1] = y1 + dy
    if (edit.handle.includes('s')) next[3] = y2 + dy
  }

  setItemBbox(edit.item, next)
}

const sortAndRenumberColumns = () => {
  const selectedKey = selectedLine.value ? ensureColumnClientKey(selectedLine.value) : null
  annotationData.value = [...annotationData.value]
    .sort((a, b) => {
      const ax = a.bbox?.[0] ?? 0
      const bx = b.bbox?.[0] ?? 0
      return bx - ax
    })
    .map((item, index) => ({
      ...item,
      __clientKey: ensureColumnClientKey(item),
      colId: index + 1
    }))

  if (selectedKey) {
    selectedLine.value = annotationData.value.find(item => item.__clientKey === selectedKey) || null
    highlightedLineId.value = selectedLine.value?.colId ?? null
  }
}

const addAnnotationBox = () => {
  if (!imageLoaded.value || !imageWidth.value || !imageHeight.value) {
    ElMessage.warning('图片加载完成后才能新增标注框')
    return
  }

  const viewport = imageContainerRef.value
  const centerDisplayX = viewport
    ? (viewport.scrollLeft + viewport.clientWidth / 2 - 24) / zoomLevel.value
    : imageDisplayWidth.value / 2
  const centerDisplayY = viewport
    ? (viewport.scrollTop + viewport.clientHeight / 2 - 24) / zoomLevel.value
    : imageDisplayHeight.value / 2
  const centerX = clamp(centerDisplayX / scaleRatio.value, 0, imageWidth.value)
  const centerY = clamp(centerDisplayY / scaleRatio.value, 0, imageHeight.value)
  const boxWidth = Math.max(60, imageWidth.value * 0.08)
  const boxHeight = Math.max(180, imageHeight.value * 0.45)
  const newItem = {
    id: null,
    annotationId: Number(annotationId.value),
    colId: annotationData.value.length + 1,
    content: '',
    contentChange: '',
    uncertainNote: '',
    createdAt: null,
    updatedAt: null,
    __clientKey: `column-new-${Date.now()}`,
    bbox: normalizeBbox([
      centerX - boxWidth / 2,
      centerY - boxHeight / 2,
      centerX + boxWidth / 2,
      centerY + boxHeight / 2
    ]),
    relativeCoords: []
  }
  setItemBbox(newItem, newItem.bbox)
  annotationData.value.push(newItem)
  selectedLine.value = newItem
  sortAndRenumberColumns()
}

const deleteSelectedBox = async () => {
  if (!selectedLine.value) return

  try {
    await ElMessageBox.confirm('删除后将重新排列列编号，是否继续？', '删除此列', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  const target = selectedLine.value
  annotationData.value = annotationData.value.filter(item => item !== target)
  selectedLine.value = null
  highlightedLineId.value = null
  sortAndRenumberColumns()
}

// 文件上传相关
const triggerFileUpload = () => {
  try {
    assertWritable(currentUser.value)
  } catch {
    ElMessage.warning(READONLY_MESSAGE)
    return
  }
  fileInputRef.value?.click()
}

const handleFileChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    assertWritable(currentUser.value)
  } catch {
    ElMessage.warning(READONLY_MESSAGE)
    event.target.value = ''
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件')
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
    assertWritable(currentUser.value)
    if (!projectId.value || !userId.value) {
      throw new Error('缺少 projectId 或 userId，无法发起 OCR 请求')
    }

    const result = await processImage(file, {
      projectId: projectId.value,
      userId: userId.value
    })

    // 适配新的数据结构
    if (result.data) {
      const annotation = result.data.annotation

      // 转换 columnAnnotations 为标注数据数组
      // 后端坐标是基于 1000x1000 的标准化坐标系统
      const COORD_SYSTEM_SIZE = 1000

      annotationData.value = (annotation?.columnAnnotations || []).map(col => {
        // 先转换为相对坐标（0-1之间）
        const relX1 = col.coordX1 / COORD_SYSTEM_SIZE
        const relY1 = col.coordY1 / COORD_SYSTEM_SIZE
        const relX2 = col.coordX2 / COORD_SYSTEM_SIZE
        const relY2 = col.coordY2 / COORD_SYSTEM_SIZE

        return {
          ...col,
          // 保存相对坐标，等图片加载后再转换为绝对坐标
          relativeCoords: [relX1, relY1, relX2, relY2],
          bbox: [col.coordX1, col.coordY1, col.coordX2, col.coordY2] // 临时使用原始坐标
        }
      })
      annotationData.value.forEach(ensureColumnClientKey)

      // 保存结构化信息
      structuredInfo.value = annotation?.structuredInfo || createDefaultStructuredInfo()
      classicalTerms.value = annotation?.classicalTerms || []
      dialectNotes.value = annotation?.dialectNotes || []
      needReviewItems.value = annotation?.needReviewItems || []
      tokenUsage.value = result.data.tokenUsage || null

      // 保存图片 URL
      if (result.data.imageInput) {
        imageUrl.value = result.data.imageInput
      }

      rawData.value = result.data
    }

    console.log('标注数据加载成功：', annotationData.value)
  } catch (error) {
    console.error('上传处理失败：', error)
    ElMessage.error(`上传处理失败：${error.message}`)
    imageUrl.value = ''
    annotationData.value = []
  } finally {
    isUploading.value = false
  }
}

const loadAnnotationOrder = async () => {
  if (!projectId.value || !isDetailMode.value) {
    annotationOrder.value = []
    return
  }

  try {
    const result = await getAnnotationListByProject(projectId.value)
    annotationOrder.value = Array.isArray(result?.data) ? result.data : []
  } catch (error) {
    console.error('加载标注顺序失败：', error)
    annotationOrder.value = []
  }
}

const goToPrevAnnotation = () => {
  if (!hasPrev.value) return
  const target = annotationOrder.value[currentAnnotationIndex.value - 1]
  if (!target?.id) return
  router.push(`/classinfo/detail/${projectId.value}/annotation/${target.id}`)
}

const goToNextAnnotation = () => {
  if (!hasNext.value) return
  const target = annotationOrder.value[currentAnnotationIndex.value + 1]
  if (!target?.id) return
  router.push(`/classinfo/detail/${projectId.value}/annotation/${target.id}`)
}

const backToProjectList = async () => {
  if (document.fullscreenElement) {
    try {
      await document.exitFullscreen()
    } catch (err) {
      console.error('退出全屏失败：', err)
    }
  }
  router.push(`/classinfo/detail/${projectId.value}`)
}

// 图片加载相关
const onImageLoad = () => {
  if (imageRef.value) {
    console.log('图片加载完成，开始更新尺寸')
    // 使用 nextTick 确保 DOM 已更新
    nextTick(() => {
      updateImageDimensions()
    })
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

    console.log('图片尺寸信息:', {
      natural: { width: naturalWidth, height: naturalHeight },
      display: { width: displayWidth, height: displayHeight },
      scaleRatio: scaleRatio.value
    })

    // 重要：图片加载后，将相对坐标转换为基于实际图片尺寸的绝对坐标
    if (annotationData.value.length > 0 && annotationData.value[0].relativeCoords) {
      console.log('开始转换相对坐标为实际坐标...')
      annotationData.value = annotationData.value.map(item => {
        const [relX1, relY1, relX2, relY2] = item.relativeCoords
        const actualBbox = [
          relX1 * naturalWidth,
          relY1 * naturalHeight,
          relX2 * naturalWidth,
          relY2 * naturalHeight
        ]
        return {
          ...item,
          bbox: actualBbox
        }
      })

      console.log('坐标转换完成！')
      console.log('第一个bbox实际坐标:', annotationData.value[0].bbox)
      console.log('缩放后坐标:', {
        x: annotationData.value[0].bbox[0] * scaleRatio.value,
        y: annotationData.value[0].bbox[1] * scaleRatio.value,
        width: (annotationData.value[0].bbox[2] - annotationData.value[0].bbox[0]) * scaleRatio.value,
        height: (annotationData.value[0].bbox[3] - annotationData.value[0].bbox[1]) * scaleRatio.value
      })
    }
  }
}

// 交互事件处理
const handleBboxClick = (item) => {
  selectedLine.value = item
  highlightedLineId.value = item.colId
  scrollToLine(item.colId)
}

const handleLineClick = (item) => {
  selectedLine.value = item
  highlightedLineId.value = item.colId
}

const handleBboxHover = (colId) => {
  if (!selectedLine.value) {
    highlightedLineId.value = colId
  }
}

const handleBboxLeave = () => {
  if (!selectedLine.value) {
    highlightedLineId.value = null
  }
}

const handleLineHover = (colId) => {
  if (!selectedLine.value) {
    highlightedLineId.value = colId
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

const scrollToLine = (colId) => {
  nextTick(() => {
    if (textCanvasRef.value) {
      const lineElement = textCanvasRef.value.querySelector(`[data-line-id="${colId}"]`)
      if (lineElement) {
        lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  })
}

const syncScroll = (sourceEl, targetEl) => {
  if (!sourceEl || !targetEl || syncingScroll.value) return
  syncingScroll.value = true
  targetEl.scrollLeft = sourceEl.scrollLeft
  targetEl.scrollTop = sourceEl.scrollTop
  requestAnimationFrame(() => {
    syncingScroll.value = false
  })
}

const handleImageScroll = () => {
  syncScroll(imageContainerRef.value, textCanvasRef.value)
}

const handleTextScroll = () => {
  syncScroll(textCanvasRef.value, imageContainerRef.value)
}

// 缩放控制
const zoomIn = () => {
  if (zoomLevel.value < 5) {
    zoomLevel.value = Math.min(5, zoomLevel.value + 0.1)
  }
}

const zoomOut = () => {
  if (zoomLevel.value > 0.3) {
    zoomLevel.value = Math.max(0.3, zoomLevel.value - 0.1)
  }
}

const resetZoom = () => {
  zoomLevel.value = 1
}

// 鼠标滚轮：在图片/框上缩放；空白区域正常滚动（且双栏联动）
const handleWheel = (event) => {
  if (!imageUrl.value) return

  // 检查鼠标是否在图片或文本框上
  const target = event.target
  const isOnImage = target.closest('.qiaopi-image') || target.closest('.bbox-overlay')
  const isOnTextArea = target.closest('.text-canvas-wrapper') || target.closest('.text-canvas-item')

  // 只有在图片或 OCR 框区域上才缩放，否则正常滚动
  if (isOnImage || isOnTextArea) {
    event.preventDefault()

    // 增加灵敏度
    const delta = -event.deltaY / 500
    const newZoom = zoomLevel.value + delta

    // 扩大缩放范围：0.3 ~ 5
    zoomLevel.value = Math.max(0.3, Math.min(5, newZoom))
  }
  // 否则允许默认滚动，由 scroll 事件做双栏联动
}

// 鼠标拖动功能
const handleMouseDown = (event) => {
  if (!imageUrl.value || event.button !== 0) return
  if (activeBoxEdit.value || event.target.closest('.bbox-rect') || event.target.closest('.bbox-handle')) return

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
  const fullscreenTarget = document.documentElement

  if (!document.fullscreenElement) {
    try {
      await fullscreenTarget.requestFullscreen()
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

const tryAutoEnterFullscreen = async () => {
  if (document.fullscreenElement) return
  try {
    await document.documentElement.requestFullscreen()
    isFullscreen.value = true
  } catch {
    // 浏览器策略限制时静默处理，后续由用户手势触发。
  }
}

// 编辑功能
const updateText = () => {
  // 文本更新会实时反映在标注数据中
}

const confidenceColor = (score) => {
  if (score >= 0.7) return 'var(--app-status)'
  return 'var(--app-accent)'
}

const createDefaultStructuredInfo = () => ({
  id: null,
  annotationId: Number(annotationId.value),
  confidence: null,
  confidenceCalculation: '',
  coreEvent: '',
  createdAt: null,
  gregorianDate: '',
  originalDate: '',
  receivePlace: '',
  receiver: '',
  remittanceInfo: '',
  sendPlace: '',
  sender: '',
  updatedAt: null
})

const ensureStructuredInfo = () => {
  if (!structuredInfo.value) {
    structuredInfo.value = createDefaultStructuredInfo()
  } else if (!structuredInfo.value.annotationId) {
    structuredInfo.value.annotationId = Number(annotationId.value)
  }
}

const getEditableKey = (item, index, prefix) => {
  if (!item.__clientKey) {
    item.__clientKey = `${prefix}-${item.id ?? 'new'}-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`
  }
  return item.__clientKey
}

const addClassicalTerm = () => {
  ensureStructuredInfo()
  classicalTerms.value.push({
    id: null,
    structuredInfoId: structuredInfo.value?.id ?? null,
    term: '',
    explanation: ''
  })
}

const removeClassicalTerm = (index) => {
  classicalTerms.value.splice(index, 1)
}

const addDialectNote = () => {
  ensureStructuredInfo()
  dialectNotes.value.push({
    id: null,
    structuredInfoId: structuredInfo.value?.id ?? null,
    original: '',
    note: ''
  })
}

const removeDialectNote = (index) => {
  dialectNotes.value.splice(index, 1)
}

const addNeedReviewItem = () => {
  ensureStructuredInfo()
  needReviewItems.value.push({
    id: null,
    structuredInfoId: structuredInfo.value?.id ?? null,
    item: ''
  })
}

const removeNeedReviewItem = (index) => {
  needReviewItems.value.splice(index, 1)
}

const openSaveConfirm = () => {
  try {
    assertWritable(currentUser.value)
  } catch {
    ElMessage.warning(READONLY_MESSAGE)
    return
  }

  if (!annotationData.value.length) {
    ElMessage.warning('没有标注数据可以保存')
    return
  }
  if (!annotationId.value) {
    ElMessage.warning('详情模式下才能保存标注')
    return
  }
  showSaveDialog.value = true
}

const closeSaveConfirm = () => {
  if (isSaving.value) return
  showSaveDialog.value = false
}

const save = async () => {
  try {
    assertWritable(currentUser.value)
  } catch {
    ElMessage.warning(READONLY_MESSAGE)
    return
  }

  if (!annotationData.value.length || !annotationId.value) {
    ElMessage.warning('当前无可保存标注')
    return
  }

  showSaveDialog.value = false
  isSaving.value = true
  try {
    await saveAnnotation(annotationData.value, {
      userId: userId.value,
      annotationId: annotationId.value,
      imageWidth: imageWidth.value,
      imageHeight: imageHeight.value,
      imageInput: imageUrl.value || rawData.value?.imageInput || '',
      success: rawData.value?.success ?? true,
      parseSuccess: rawData.value?.annotation?.parseSuccess ?? true,
      errorMsg: rawData.value?.annotation?.errorMsg || rawData.value?.errorMsg || '',
      structuredInfo: structuredInfo.value,
      classicalTerms: classicalTerms.value,
      dialectNotes: dialectNotes.value,
      needReviewItems: needReviewItems.value,
      tokenUsage: tokenUsage.value
    })
    ElMessage.success('标注结果已保存')
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    isSaving.value = false
  }
}

// 加载已有标注详情
const loadExistingAnnotation = async (id) => {
  isUploading.value = true
  try {
    console.log('开始加载标注详情，ID:', id)
    const result = await getAnnotationDetail(id)
    console.log('API 返回数据：', result)

    // 适配新的数据结构
    if (result.data) {
      const annotation = result.data.annotation
      console.log('解析 annotation:', annotation)

      // 转换 columnAnnotations 为标注数据数组
      // 后端坐标是基于 1000x1000 的标准化坐标系统
      const COORD_SYSTEM_SIZE = 1000

      annotationData.value = (annotation?.columnAnnotations || []).map(col => {
        // 先转换为相对坐标（0-1之间）
        const relX1 = col.coordX1 / COORD_SYSTEM_SIZE
        const relY1 = col.coordY1 / COORD_SYSTEM_SIZE
        const relX2 = col.coordX2 / COORD_SYSTEM_SIZE
        const relY2 = col.coordY2 / COORD_SYSTEM_SIZE

        return {
          ...col,
          // 保存相对坐标，等图片加载后再转换为绝对坐标
          relativeCoords: [relX1, relY1, relX2, relY2],
          bbox: [col.coordX1, col.coordY1, col.coordX2, col.coordY2] // 临时使用原始坐标
        }
      })
      annotationData.value.forEach(ensureColumnClientKey)

      console.log('转换后的 annotationData:', annotationData.value)

      // 详细调试信息
      console.log('=== 坐标调试信息 ===')
      console.log('列数:', annotationData.value.length)

      // 找出X和Y的范围
      const allX = annotationData.value.flatMap(col => [col.bbox[0], col.bbox[2]])
      const allY = annotationData.value.flatMap(col => [col.bbox[1], col.bbox[3]])
      console.log('X坐标范围:', Math.min(...allX), '-', Math.max(...allX))
      console.log('Y坐标范围:', Math.min(...allY), '-', Math.max(...allY))

      // 打印每一列的信息
      annotationData.value.forEach(col => {
        console.log(`列${col.colId}: [${col.bbox[0]}, ${col.bbox[1]}, ${col.bbox[2]}, ${col.bbox[3]}] 宽=${col.bbox[2]-col.bbox[0]} 高=${col.bbox[3]-col.bbox[1]}`)
      })
      console.log('===================')

      // 保存结构化信息
      structuredInfo.value = annotation?.structuredInfo || createDefaultStructuredInfo()
      classicalTerms.value = annotation?.classicalTerms || []
      dialectNotes.value = annotation?.dialectNotes || []
      needReviewItems.value = annotation?.needReviewItems || []
      tokenUsage.value = result.data.tokenUsage || null

      // 保存图片 URL
      if (result.data.imageInput) {
        imageUrl.value = result.data.imageInput
        console.log('设置图片 URL:', imageUrl.value)
      }

      rawData.value = result.data
    } else {
      console.warn('result.data 不存在:', result)
    }

    console.log('已有标注数据加载成功，annotationData:', annotationData.value)
  } catch (error) {
    console.error('加载标注详情失败：', error)
    ElMessage.error(`加载标注失败：${error.message}`)
  } finally {
    isUploading.value = false
  }
}

// 生命周期
const handleResize = () => {
  if (imageLoaded.value) {
    updateImageDimensions()
  }

  if (editPanelPosition.value) {
    const panel = document.querySelector('.edit-panel')
    const rect = panel?.getBoundingClientRect()
    editPanelPosition.value = clampEditPanelPosition(
      editPanelPosition.value.x,
      editPanelPosition.value.y,
      rect?.width ?? 350,
      rect?.height ?? 420
    )
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

const handleFirstInteractionFullscreen = async () => {
  await tryAutoEnterFullscreen()
  if (document.fullscreenElement) {
    window.removeEventListener('click', handleFirstInteractionFullscreen)
    window.removeEventListener('keydown', handleFirstInteractionFullscreen)
  }
}

const reloadDetailByRoute = async (id) => {
  if (!id) return
  selectedLine.value = null
  highlightedLineId.value = null
  await loadExistingAnnotation(id)
}

onMounted(async () => {
  window.addEventListener('resize', handleResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  await tryAutoEnterFullscreen()
  if (!document.fullscreenElement) {
    window.addEventListener('click', handleFirstInteractionFullscreen)
    window.addEventListener('keydown', handleFirstInteractionFullscreen)
  }

  if (isDetailMode.value) {
    await Promise.all([
      reloadDetailByRoute(annotationId.value),
      loadAnnotationOrder()
    ])
  }
})

watch(annotationId, async (newId, oldId) => {
  if (!newId || newId === oldId) return
  await reloadDetailByRoute(newId)
})

watch(projectId, async (newProjectId, oldProjectId) => {
  if (!isDetailMode.value) return
  if (newProjectId && newProjectId !== oldProjectId) {
    await loadAnnotationOrder()
  }
})

onBeforeUnmount(() => {
  stopBoxEdit()
  stopEditPanelDrag()
  window.removeEventListener('resize', handleResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  window.removeEventListener('click', handleFirstInteractionFullscreen)
  window.removeEventListener('keydown', handleFirstInteractionFullscreen)
})
</script>

<style scoped src="../styles/annotation.css"></style>
