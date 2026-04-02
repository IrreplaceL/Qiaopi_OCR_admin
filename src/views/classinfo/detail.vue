<template>
  <div class="detail-page">
    <!-- 顶部面包屑 + 返回 -->
    <div class="page-header">
      <el-button :icon="ArrowLeft" @click="router.back()">返回</el-button>
      <span class="page-title">项目标注列表</span>
      <span class="page-sub">共 {{ list.length }} 张图片，已标注 {{ annotatedCount }} 张</span>
      <el-button type="primary" class="add-btn" @click="goToAnnotationNew">
        新增标注图片
      </el-button>
      <input
        ref="uploadInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleUploadFiles"
      />
    </div>

    <!-- 加载中 -->
    <div v-loading="loading" class="image-grid">
      <el-empty v-if="!loading && list.length === 0" description="该项目暂无标注数据" />

      <div
        v-for="item in list"
        :key="item.id"
        class="image-card"
        @click="goToAnnotationDetail(item.id)"
      >
        <!-- 图片区域 -->
        <div class="image-wrap">
          <el-image
            :src="item.imageUrl"
            :preview-disabled="true"
            fit="cover"
            loading="lazy"
            class="image"
          >
            <template #placeholder>
              <div class="image-slot loading">
                <el-icon class="is-loading"><Loading /></el-icon>
              </div>
            </template>
            <template #error>
              <div class="image-slot error">
                <el-icon><PictureFilled /></el-icon>
                <span>加载失败</span>
              </div>
            </template>
          </el-image>

          <!-- 标注状态角标 -->
          <el-tag
            :type="item.annotated ? 'success' : 'info'"
            class="status-tag"
            size="small"
            effect="dark"
          >
            {{ item.annotated ? '已标注' : '未标注' }}
          </el-tag>
        </div>

        <!-- 底部信息 -->
        <div class="image-footer">
          <span class="image-id">ID: {{ item.id }}</span>
          <span class="image-time">{{ item.updateTime }}</span>
        </div>
      </div>
    </div>

    <div
      v-if="showProgressPanel"
      ref="progressPanelRef"
      class="upload-progress-panel"
      :class="{ collapsed: progressPanelCollapsed, dragging: isDraggingPanel }"
      :style="progressPanelStyle"
    >
      <div class="upload-progress-header" @mousedown="onPanelHeaderMouseDown">
        <span class="upload-progress-title">OCR 批量上传进度</span>
        <div class="upload-progress-actions">
          <el-button link size="small" @click="toggleProgressPanel">
            {{ progressPanelCollapsed ? "展开" : "收起" }}
          </el-button>
          <el-button link size="small" @click="closeProgressPanel">关闭</el-button>
        </div>
      </div>

      <div v-show="!progressPanelCollapsed" class="upload-progress-body">
        <div class="progress-meta">
          <span>进度: {{ progressState.done }}/{{ progressState.total }}</span>
          <span>完成率: {{ progressPercent }}%</span>
          <span>成功: {{ progressState.success }}</span>
          <span>失败: {{ progressState.fail }}</span>
          <span>累计耗时: {{ totalElapsedLabel }}</span>
        </div>

        <div class="progress-bar-wrap">
          <div class="progress-bar" :style="{ width: `${progressPercent}%` }"></div>
        </div>

        <div class="progress-logs">
          <template v-for="log in progressLogs" :key="log.id">
            <div v-if="log.kind === 'text'" class="log-item" :class="log.level">
              [{{ log.time }}] {{ log.message }}
            </div>
            <div v-else class="highlight-card">
              <div class="highlight-title">[{{ log.time }}] 成功字段高亮 - {{ log.fileName }}</div>
              <div class="highlight-row"><span class="k">annotationId:</span> <span class="v">{{ log.fields.annotationId }}</span></div>
              <div class="highlight-row"><span class="k">qiaopiAnnotation:</span> <span class="v break-all">{{ log.fields.qiaopiAnnotation }}</span></div>
              <div class="highlight-row"><span class="k">parse_success:</span> <span class="v">{{ log.fields.parseSuccess }}</span></div>
              <div class="highlight-row"><span class="k">confidence:</span> <span class="v">{{ log.fields.confidence }}</span></div>
              <div class="highlight-row"><span class="k">column_count:</span> <span class="v">{{ log.fields.columnCount }}</span></div>
              <div class="highlight-row"><span class="k">total_tokens:</span> <span class="v">{{ log.fields.totalTokens }}</span></div>
              <div class="highlight-row"><span class="k">单张耗时:</span> <span class="v">{{ log.itemCost }}</span></div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Loading, PictureFilled  } from "@element-plus/icons-vue";
import { getAnnotationList, type AnnotationItem, uploadOcrImage } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({ name: "classinfoDetail" });

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();

const loading = ref(false);
const list = ref<AnnotationItem[]>([]);
const isBatchUploading = ref(false);
const uploadInputRef = ref<HTMLInputElement | null>(null);
const uploadStartAtRef = ref<number>(0);
const nowTickRef = ref<number>(Date.now());
const elapsedTimerRef = ref<number | null>(null);

const showProgressPanel = ref(false);
const progressPanelCollapsed = ref(false);
const progressState = ref({ total: 0, done: 0, success: 0, fail: 0 });
const progressPanelRef = ref<HTMLElement | null>(null);
const panelPosition = ref({ left: 0, top: 0 });
const panelPositionReady = ref(false);
const isDraggingPanel = ref(false);

let dragOffsetX = 0;
let dragOffsetY = 0;

type TextProgressLog = {
  id: number;
  kind: "text";
  time: string;
  level: "ok" | "err" | "info";
  message: string;
};

type HighlightProgressLog = {
  id: number;
  kind: "highlight";
  time: string;
  fileName: string;
  fields: SuccessHighlightFields;
  itemCost: string;
};

type ProgressLog = TextProgressLog | HighlightProgressLog;

const progressLogs = ref<ProgressLog[]>([]);
let progressLogId = 1;

const projectId = route.params.projectId as string;
const userId = computed(() => userStore.userId);

const annotatedCount = computed(() => list.value.filter(i => i.annotated).length);
const progressPercent = computed(() => {
  const total = progressState.value.total;
  const done = progressState.value.done;
  if (total <= 0) return 0;
  return Math.round((done / total) * 100);
});

const totalElapsedLabel = computed(() => {
  if (!uploadStartAtRef.value) return "00:00.000";
  return formatDuration(nowTickRef.value - uploadStartAtRef.value);
});

const progressPanelStyle = computed(() => {
  if (!panelPositionReady.value) return undefined;
  return {
    left: `${panelPosition.value.left}px`,
    top: `${panelPosition.value.top}px`,
    right: "auto",
    bottom: "auto"
  };
});

function goToAnnotationNew() {
  if (isBatchUploading.value) {
    ElMessage.warning("正在上传处理中，请稍候");
    return;
  }
  uploadInputRef.value?.click();
}

function goToAnnotationDetail(id: string) {
  router.push(`/classinfo/detail/${projectId}/annotation/${id}`);
}

function nowTimeLabel() {
  return new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

function formatDuration(ms: number) {
  const safeMs = Math.max(0, Math.floor(ms));
  const totalSeconds = Math.floor(safeMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const millis = safeMs % 1000;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  const mmm = String(millis).padStart(3, "0");
  return `${mm}:${ss}.${mmm}`;
}

function startElapsedTimer() {
  stopElapsedTimer();
  elapsedTimerRef.value = window.setInterval(() => {
    nowTickRef.value = Date.now();
  }, 120);
}

function stopElapsedTimer() {
  if (elapsedTimerRef.value !== null) {
    window.clearInterval(elapsedTimerRef.value);
    elapsedTimerRef.value = null;
  }
}

type SuccessHighlightFields = {
  annotationId: string;
  qiaopiAnnotation: string;
  parseSuccess: string;
  confidence: string;
  columnCount: string;
  totalTokens: string;
};

function extractSuccessHighlights(result: any): SuccessHighlightFields {
  const payload = result?.data ?? {};
  const annotation = payload?.aiResult?.annotation ?? {};
  const metadata = annotation?.structured_info ?? {};
  const columnAnnotations = annotation?.column_annotations;
  const tokenUsage = payload?.aiResult?.token_usage ?? {};

  return {
    annotationId: String(payload?.annotationId ?? "-") ,
    qiaopiAnnotation: String(payload?.qiaopiAnnotation ?? "-") ,
    parseSuccess: String(annotation?.parse_success ?? "-") ,
    confidence: String(metadata?.confidence ?? "-") ,
    columnCount: String(Array.isArray(columnAnnotations) ? columnAnnotations.length : "-") ,
    totalTokens: String(tokenUsage?.total_tokens ?? "-")
  };
}

function openProgressPanel() {
  showProgressPanel.value = true;
  progressPanelCollapsed.value = false;
  if (!panelPositionReady.value) {
    nextTick(() => {
      initPanelPosition();
    });
  }
}

function closeProgressPanel() {
  if (isBatchUploading.value) {
    ElMessage.warning("上传进行中，暂不允许关闭进度窗口");
    return;
  }
  showProgressPanel.value = false;
}

function toggleProgressPanel() {
  progressPanelCollapsed.value = !progressPanelCollapsed.value;
}

function clampPanelPosition(left: number, top: number) {
  const panelEl = progressPanelRef.value;
  if (!panelEl) return { left, top };

  const margin = window.innerWidth <= 768 ? 8 : 12;
  const maxLeft = Math.max(margin, window.innerWidth - panelEl.offsetWidth - margin);
  const maxTop = Math.max(margin, window.innerHeight - panelEl.offsetHeight - margin);
  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(top, margin), maxTop)
  };
}

function initPanelPosition() {
  const panelEl = progressPanelRef.value;
  if (!panelEl) return;

  const margin = window.innerWidth <= 768 ? 8 : 18;
  panelPosition.value = clampPanelPosition(
    window.innerWidth - panelEl.offsetWidth - margin,
    window.innerHeight - panelEl.offsetHeight - margin
  );
  panelPositionReady.value = true;
}

function onPanelHeaderMouseDown(event: MouseEvent) {
  if (event.button !== 0) return;
  const target = event.target as HTMLElement | null;
  if (target?.closest(".upload-progress-actions")) return;

  const panelEl = progressPanelRef.value;
  if (!panelEl) return;

  const rect = panelEl.getBoundingClientRect();
  panelPosition.value = { left: rect.left, top: rect.top };
  panelPositionReady.value = true;
  dragOffsetX = event.clientX - rect.left;
  dragOffsetY = event.clientY - rect.top;
  isDraggingPanel.value = true;

  window.addEventListener("mousemove", onPanelDragging);
  window.addEventListener("mouseup", onPanelDragEnd);
  event.preventDefault();
}

function onPanelDragging(event: MouseEvent) {
  if (!isDraggingPanel.value) return;
  panelPosition.value = clampPanelPosition(
    event.clientX - dragOffsetX,
    event.clientY - dragOffsetY
  );
}

function onPanelDragEnd() {
  isDraggingPanel.value = false;
  window.removeEventListener("mousemove", onPanelDragging);
  window.removeEventListener("mouseup", onPanelDragEnd);
}

function onWindowResize() {
  if (!showProgressPanel.value || !panelPositionReady.value) return;
  panelPosition.value = clampPanelPosition(panelPosition.value.left, panelPosition.value.top);
}

function updateProgressPanel(total: number, done: number, success: number, fail: number) {
  const safeTotal = Math.max(0, total);
  const safeDone = Math.max(0, Math.min(done, safeTotal));
  progressState.value = {
    total: safeTotal,
    done: safeDone,
    success: Math.max(0, success),
    fail: Math.max(0, fail)
  };
  nowTickRef.value = Date.now();
}

function appendProgressLog(text: string, level: "ok" | "err" | "info" = "info") {
  progressLogs.value.push({
    id: progressLogId += 1,
    kind: "text",
    time: nowTimeLabel(),
    level,
    message: text
  });
}

function appendSuccessHighlight(result: any, fileName: string, itemCostMs: number) {
  const fields = extractSuccessHighlights(result);
  progressLogs.value.push({
    id: progressLogId += 1,
    kind: "highlight",
    time: nowTimeLabel(),
    fileName,
    fields,
    itemCost: formatDuration(itemCostMs)
  });
}

async function handleUploadFiles(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  if (!files.length) return;

  if (!userId.value) {
    ElMessage.error("缺少 userId，无法上传");
    input.value = "";
    return;
  }

  const imageFiles = files.filter(file => file.type.startsWith("image/"));
  if (!imageFiles.length) {
    ElMessage.warning("请选择图片文件");
    input.value = "";
    return;
  }

  isBatchUploading.value = true;
  openProgressPanel();
  progressLogs.value = [];
  progressLogId = 1;
  uploadStartAtRef.value = Date.now();
  startElapsedTimer();
  appendProgressLog(
    `开始上传，项目ID=${projectId}，共 ${imageFiles.length} 张图片（后端串行，前端将逐张等待响应）`,
    "info"
  );
  updateProgressPanel(imageFiles.length, 0, 0, 0);

  let successCount = 0;

  try {
    for (let i = 0; i < imageFiles.length; i += 1) {
      const file = imageFiles[i];
      const itemStartAt = Date.now();
      appendProgressLog(`开始处理第 ${i + 1}/${imageFiles.length} 张：${file.name}`, "info");

      try {
        const result = await uploadOcrImage(file, {
          projectId,
          userId: userId.value
        });

        successCount += 1;
        const itemCost = Date.now() - itemStartAt;
        appendProgressLog(`第 ${i + 1} 张处理完成：${file.name}，耗时 ${formatDuration(itemCost)}`, "ok");
        appendSuccessHighlight(result, file.name, itemCost);
        appendProgressLog(`响应 JSON：${JSON.stringify(result, null, 2)}`, "ok");
        updateProgressPanel(imageFiles.length, i + 1, successCount, i + 1 - successCount);
      } catch (error: any) {
        const itemCost = Date.now() - itemStartAt;
        appendProgressLog(
          `第 ${i + 1} 张处理失败：${file.name}，耗时 ${formatDuration(itemCost)}，原因：${error?.message || String(error)}`,
          "err"
        );
        updateProgressPanel(imageFiles.length, i + 1, successCount, i + 1 - successCount);
      }
    }

    appendProgressLog(
      `全部处理结束：成功 ${successCount} 张，失败 ${imageFiles.length - successCount} 张，总耗时 ${formatDuration(Date.now() - uploadStartAtRef.value)}`,
      "info"
    );
    ElMessage.success(`上传任务完成：成功 ${successCount}/${imageFiles.length}`);
    await fetchList();
  } finally {
    nowTickRef.value = Date.now();
    stopElapsedTimer();
    isBatchUploading.value = false;
    uploadStartAtRef.value = 0;
    input.value = "";
  }
}

async function fetchList() {
  loading.value = true;
  try {
    const res = await getAnnotationList(projectId);
    if (res.code === 200) {
      list.value = res.data ?? [];
    } else {
      ElMessage.error(res.msg || "获取标注列表失败");
    }
  } catch {
    ElMessage.error("请求失败，请检查网络");
  } finally {
    loading.value = false;
  }
}

onMounted(() => fetchList());

onMounted(() => {
  window.addEventListener("resize", onWindowResize);
});

onBeforeUnmount(() => {
  onPanelDragEnd();
  window.removeEventListener("resize", onWindowResize);
  stopElapsedTimer();
});
</script>

<style scoped>
.detail-page {
  padding: 0 4px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.page-sub {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin-left: 4px;
}

.add-btn {
  margin-left: auto;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.image-card {
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  transition: box-shadow 0.2s, transform 0.2s;
}

.image-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.image-wrap {
  position: relative;
  width: 100%;
  padding-top: 75%; /* 4:3 比例 */
  background: var(--el-fill-color-light);
}

.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.image-slot {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.image-slot .el-icon {
  font-size: 28px;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 1;
}

.image-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 10px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-lighter);
}

.image-id {
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.upload-progress-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: min(540px, calc(100vw - 24px));
  max-height: calc(100vh - 90px);
  border-radius: 10px;
  border: 1px solid #334155;
  background: #0f172a;
  color: #e2e8f0;
  z-index: 2200;
  box-shadow: 0 14px 38px rgba(2, 6, 23, 0.45);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.upload-progress-panel.collapsed {
  max-height: none;
}

.upload-progress-header {
  padding: 10px 12px;
  background: #111827;
  border-bottom: 1px solid #334155;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
}

.upload-progress-panel.dragging {
  box-shadow: 0 18px 42px rgba(2, 6, 23, 0.58);
}

.upload-progress-panel.dragging .upload-progress-header {
  cursor: grabbing;
}

.upload-progress-title {
  font-size: 13px;
  font-weight: 700;
  color: #93c5fd;
}

.upload-progress-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.upload-progress-body {
  display: flex;
  flex-direction: column;
  min-height: 220px;
}

.progress-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 10px 12px 8px;
  font-size: 12px;
  color: #93c5fd;
}

.progress-bar-wrap {
  margin: 0 12px 8px;
  height: 10px;
  border-radius: 999px;
  background: #1e293b;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background: linear-gradient(90deg, #22c55e, #14b8a6);
  transition: width 0.25s ease;
}

.progress-logs {
  padding: 8px 12px 12px;
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  font-family: Consolas, "Courier New", monospace;
  font-size: 12px;
  line-height: 1.55;
}

.log-item {
  margin-bottom: 4px;
  white-space: pre-wrap;
  word-break: break-word;
}

.log-item.ok {
  color: #34d399;
}

.log-item.err {
  color: #f87171;
}

.log-item.info {
  color: #93c5fd;
}

.highlight-card {
  margin: 6px 0 10px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid #1d4ed8;
  background: #0b1f3d;
  color: #dbeafe;
}

.highlight-title {
  color: #93c5fd;
  font-weight: 700;
  margin-bottom: 4px;
}

.highlight-row {
  margin: 2px 0;
}

.k {
  color: #60a5fa;
}

.v {
  color: #bfdbfe;
}

.break-all {
  word-break: break-all;
}

@media (max-width: 768px) {
  .upload-progress-panel {
    left: 8px;
    right: 8px;
    bottom: 8px;
    width: auto;
    max-height: calc(100vh - 16px);
  }

  .progress-logs {
    max-height: calc(100vh - 280px);
  }
}
</style>
