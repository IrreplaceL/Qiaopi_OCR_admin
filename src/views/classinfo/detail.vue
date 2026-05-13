<template>
  <section class="detail-page">
    <div class="page-hero">
      <div>
        <button class="archive-button ghost" type="button" @click="goToProjectGroups">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </button>
        <div class="hero-copy">
          <span class="archive-kicker">Document Set</span>
          <h1 class="archive-title">侨批图像档案</h1>
          <p class="archive-subtitle">
            共 {{ list.length }} 张图像，已完成 {{ annotatedCount }} 张。点击卡片进入双栏对照标注。
          </p>
        </div>
      </div>
      <div class="hero-actions">
        <el-radio-group v-model="annotationFilter" @change="fetchList">
          <el-radio-button label="all">未筛选</el-radio-button>
          <el-radio-button label="unannotated">未标注</el-radio-button>
          <el-radio-button label="annotated">已标注</el-radio-button>
        </el-radio-group>
        <el-button :icon="selectionMode ? Close : Check" @click="toggleSelectionMode">
          {{ selectionMode ? "退出多选" : "多选" }}
        </el-button>
        <el-dropdown v-if="selectionMode" trigger="click" @command="handleExportCommand">
          <el-button :icon="Download" :loading="exporting">
            导出所选
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="json">导出 JSON</el-dropdown-item>
              <el-dropdown-item command="html">导出 HTML</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button
          v-if="selectionMode"
          type="danger"
          :icon="Delete"
          :loading="deleting"
          @click="deleteSelectedAnnotations"
        >
          删除所选
        </el-button>
        <el-button type="primary" class="add-btn" @click="goToAnnotationNew">
          新增标注图像
        </el-button>
      </div>
      <input
        ref="uploadInputRef"
        type="file"
        accept="image/*"
        multiple
        style="display: none"
        @change="handleUploadFiles"
      />
    </div>

    <div v-loading="loading" class="image-grid">
      <el-empty v-if="!loading && list.length === 0" description="该项目暂无标注数据" />

      <article
        v-for="item in list"
        :key="item.id"
        :class="['image-card', { selected: isAnnotationSelected(item.id) }]"
        @click="handleAnnotationCardClick(item)"
      >
        <div class="image-wrap">
          <el-checkbox
            v-if="selectionMode"
            class="selection-checkbox"
            :model-value="isAnnotationSelected(item.id)"
            @click.stop
            @change="toggleAnnotationSelection(item.id)"
          />
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
          <span :class="['status-dot', getStatusInfo(item).className]">
            {{ getStatusInfo(item).label }}
          </span>
        </div>

        <div class="image-footer">
          <div>
            <h2>{{ getImageTitle(item) }}</h2>
            <span>ID {{ item.id }}</span>
          </div>
          <time>{{ item.updateTime }}</time>
        </div>
      </article>
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
          <span>进度 {{ progressState.done }}/{{ progressState.total }}</span>
          <span>完成率 {{ progressPercent }}%</span>
          <span>成功 {{ progressState.success }}</span>
          <span>失败 {{ progressState.fail }}</span>
          <span>耗时 {{ totalElapsedLabel }}</span>
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
              <div class="highlight-title">[{{ log.time }}] 识别完成 - {{ log.fileName }}</div>
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
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  Check,
  Close,
  Delete,
  Download,
  Loading,
  PictureFilled
} from "@element-plus/icons-vue";
import {
  deleteAnnotations,
  exportAnnotations,
  getAnnotationList,
  type AnnotationExportFormat,
  type AnnotationItem,
  uploadOcrImage
} from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import { READONLY_MESSAGE, assertWritable } from "@/utils/permission";
import { downloadBlob, getFileNameFromDisposition } from "@/utils/download";

defineOptions({ name: "classinfoDetail" });

type ExtendedAnnotationItem = AnnotationItem & {
  title?: string;
  status?: string;
  createTime?: string;
};

type AnnotationFilter = "all" | "unannotated" | "annotated";

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

type SuccessHighlightFields = {
  annotationId: string;
  qiaopiAnnotation: string;
  parseSuccess: string;
  confidence: string;
  columnCount: string;
  totalTokens: string;
};

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();

const loading = ref(false);
const list = ref<ExtendedAnnotationItem[]>([]);
const annotationFilter = ref<AnnotationFilter>("all");
const selectionMode = ref(false);
const selectedAnnotationIds = ref<string[]>([]);
const isBatchUploading = ref(false);
const exporting = ref(false);
const deleting = ref(false);
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
const progressLogs = ref<ProgressLog[]>([]);
const UPLOAD_RECOVERY_POLL_INTERVAL_MS = 5000;
const UPLOAD_RECOVERY_TIMEOUT_MS = 5 * 60 * 1000;

let dragOffsetX = 0;
let dragOffsetY = 0;
let progressLogId = 1;

const projectId = computed(() => route.params.projectId as string);
const userId = computed(() => userStore.userId);
const currentUser = computed(() => ({
  id: userStore.userId,
  role: userStore.role
}));
const annotatedCount = computed(() => list.value.filter(i => i.annotated === true).length);
const filterAnnotatedValue = computed(() => {
  if (annotationFilter.value === "annotated") return true;
  if (annotationFilter.value === "unannotated") return false;
  return undefined;
});
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

function getImageTitle(item: ExtendedAnnotationItem) {
  return item.title || `侨批图像 ${item.id}`;
}

function getStatusInfo(item: ExtendedAnnotationItem) {
  const status = String(item.status || "").toLowerCase();
  if (["processing", "pending", "running", "ai_processing"].some(value => status.includes(value))) {
    return { label: "AI处理中", className: "processing" };
  }
  if (item.annotated) return { label: "已完成", className: "done" };
  return { label: "未标注", className: "" };
}

function goToAnnotationNew() {
  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }
  if (isBatchUploading.value) {
    ElMessage.warning("正在上传处理中，请稍候");
    return;
  }
  uploadInputRef.value?.click();
}

function goToAnnotationDetail(id: string) {
  router.push(`/classinfo/detail/${projectId.value}/annotation/${id}`);
}

function goToProjectGroups() {
  router.push("/classinfo/index");
}

function handleAnnotationCardClick(item: ExtendedAnnotationItem) {
  if (selectionMode.value) {
    toggleAnnotationSelection(item.id);
    return;
  }
  goToAnnotationDetail(item.id);
}

function isAnnotationSelected(id: string | number) {
  return selectedAnnotationIds.value.includes(String(id));
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  selectedAnnotationIds.value = [];
}

function toggleAnnotationSelection(id: string | number) {
  const normalizedId = String(id);
  selectedAnnotationIds.value = isAnnotationSelected(normalizedId)
    ? selectedAnnotationIds.value.filter(item => item !== normalizedId)
    : [...selectedAnnotationIds.value, normalizedId];
}

async function handleExportCommand(command: string | number | object) {
  const format = String(command) as AnnotationExportFormat;
  if (!["json", "html"].includes(format)) return;
  if (!selectedAnnotationIds.value.length) {
    ElMessage.warning("请先选择要导出的标注");
    return;
  }

  exporting.value = true;
  try {
    const { blob, disposition } = await exportAnnotations({
      userId: userStore.userId || 0,
      ids: selectedAnnotationIds.value,
      format
    });
    const fileName =
      getFileNameFromDisposition(disposition) || `qiaopi_annotations.${format}`;
    downloadBlob(blob, fileName);
    ElMessage.success("导出已开始");
  } catch (error: any) {
    ElMessage.error(error?.message || "导出失败");
  } finally {
    exporting.value = false;
  }
}

async function deleteSelectedAnnotations() {
  if (!selectedAnnotationIds.value.length) {
    ElMessage.warning("请先选择要删除的标注");
    return;
  }

  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }

  try {
    await ElMessageBox.confirm(
      "删除后不可恢复，是否确定删除所选标注？",
      "删除标注",
      {
        confirmButtonText: "删除",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
  } catch {
    return;
  }

  deleting.value = true;
  try {
    const res = await deleteAnnotations({
      userId: userStore.userId,
      ids: selectedAnnotationIds.value
    });
    if (res.code !== 200) {
      ElMessage.error(res.msg || "删除标注失败");
      return;
    }
    const deletedIds = new Set(selectedAnnotationIds.value);
    list.value = list.value.filter(item => !deletedIds.has(String(item.id)));
    selectedAnnotationIds.value = [];
    selectionMode.value = false;
    ElMessage.success("标注已删除");
  } catch (error: any) {
    ElMessage.error(error?.message || "删除标注失败");
  } finally {
    deleting.value = false;
  }
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

function extractSuccessHighlights(result: any): SuccessHighlightFields {
  const payload = result?.data ?? {};
  const annotation = payload?.aiResult?.annotation ?? {};
  const metadata = annotation?.structured_info ?? {};
  const columnAnnotations = annotation?.column_annotations;
  const tokenUsage = payload?.aiResult?.token_usage ?? {};

  return {
    annotationId: String(payload?.annotationId ?? "-"),
    qiaopiAnnotation: String(payload?.qiaopiAnnotation ?? "-"),
    parseSuccess: String(annotation?.parse_success ?? "-"),
    confidence: String(metadata?.confidence ?? "-"),
    columnCount: String(Array.isArray(columnAnnotations) ? columnAnnotations.length : "-"),
    totalTokens: String(tokenUsage?.total_tokens ?? "-")
  };
}

function extractUploadAnnotationId(result: any) {
  const payload = result?.data ?? {};
  const id = payload?.annotationId ?? payload?.id;
  return id == null ? "" : String(id);
}

function buildRecoveredUploadResult(item: ExtendedAnnotationItem): any {
  return {
    code: 200,
    msg: "后端处理完成",
    data: {
      annotationId: item.id,
      qiaopiAnnotation: item.imageUrl,
      aiResult: {
        annotation: {
          parse_success: true,
          column_annotations: []
        },
        token_usage: {}
      }
    }
  };
}

function isRecoverableUploadError(error: any) {
  const status = Number(error?.status);
  const message = String(error?.message || error || "").toLowerCase();
  return (
    [502, 503, 504, 524].includes(status) ||
    /timeout|timed out|gateway|504|502|503|524|failed to fetch|network/.test(message)
  );
}

function sleep(ms: number) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

async function loadAnnotationIdSnapshot() {
  try {
    const res = await getAnnotationList(projectId.value);
    if (res.code === 200) {
      return new Set((res.data ?? []).map(item => String(item.id)));
    }
  } catch {
    // 当前列表仍可作为兜底快照，避免一次列表请求失败就中断上传。
  }
  return new Set(list.value.map(item => String(item.id)));
}

async function waitForRecoveredUpload(knownIds: Set<string>) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < UPLOAD_RECOVERY_TIMEOUT_MS) {
    await sleep(UPLOAD_RECOVERY_POLL_INTERVAL_MS);

    try {
      const res = await getAnnotationList(projectId.value);
      if (res.code !== 200) continue;

      const recovered = (res.data ?? []).find(item => !knownIds.has(String(item.id)));
      if (recovered) {
        return recovered;
      }
    } catch {
      // 轮询期间可能正好遇到后端仍在忙，继续等下一轮。
    }
  }

  return null;
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

  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    input.value = "";
    return;
  }

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
    `开始上传，项目ID=${projectId.value}，共 ${imageFiles.length} 张图片`,
    "info"
  );
  updateProgressPanel(imageFiles.length, 0, 0, 0);

  let successCount = 0;
  const knownAnnotationIds = await loadAnnotationIdSnapshot();

  try {
    for (let i = 0; i < imageFiles.length; i += 1) {
      const file = imageFiles[i];
      const itemStartAt = Date.now();
      appendProgressLog(`开始处理第 ${i + 1}/${imageFiles.length} 张：${file.name}`, "info");

      try {
        const result = await uploadOcrImage(file, {
          projectId: projectId.value,
          userId: userId.value
        });

        successCount += 1;
        const createdId = extractUploadAnnotationId(result);
        if (createdId) {
          knownAnnotationIds.add(createdId);
        }
        const itemCost = Date.now() - itemStartAt;
        appendProgressLog(`第 ${i + 1} 张处理完成：${file.name}，耗时 ${formatDuration(itemCost)}`, "ok");
        appendSuccessHighlight(result, file.name, itemCost);
        appendProgressLog(`响应 JSON：${JSON.stringify(result, null, 2)}`, "ok");
        updateProgressPanel(imageFiles.length, i + 1, successCount, i + 1 - successCount);
      } catch (error: any) {
        if (isRecoverableUploadError(error)) {
          appendProgressLog(
            `第 ${i + 1} 张请求已超时，但后端可能仍在处理：${file.name}。开始等待数据库新增记录...`,
            "info"
          );
          const recovered = await waitForRecoveredUpload(knownAnnotationIds);
          if (recovered) {
            knownAnnotationIds.add(String(recovered.id));
            successCount += 1;
            const itemCost = Date.now() - itemStartAt;
            const recoveredResult = buildRecoveredUploadResult(recovered);
            appendProgressLog(
              `第 ${i + 1} 张后端处理完成：${file.name}，annotationId=${recovered.id}，总耗时 ${formatDuration(itemCost)}`,
              "ok"
            );
            appendSuccessHighlight(recoveredResult, file.name, itemCost);
            updateProgressPanel(imageFiles.length, i + 1, successCount, i + 1 - successCount);
            continue;
          }
        }

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
    const res = await getAnnotationList(projectId.value, filterAnnotatedValue.value);
    if (res.code === 200) {
      list.value = res.data ?? [];
      const visibleIds = new Set(list.value.map(item => String(item.id)));
      selectedAnnotationIds.value = selectedAnnotationIds.value.filter(id =>
        visibleIds.has(id)
      );
    } else {
      ElMessage.error(res.msg || "获取标注列表失败");
    }
  } catch {
    ElMessage.error("请求失败，请检查网络");
  } finally {
    loading.value = false;
  }
}

watch(
  projectId,
  () => {
    selectedAnnotationIds.value = [];
    selectionMode.value = false;
    fetchList();
  },
  { immediate: true }
);

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
  max-width: 1440px;
  margin: 0 auto;
}

.page-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--app-space-6);
  margin-bottom: var(--app-space-8);
}

.hero-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-3);
  flex-wrap: wrap;
  justify-content: flex-end;
}

.hero-copy {
  margin-top: var(--app-space-6);
}

.hero-copy .archive-subtitle {
  margin: var(--app-space-3) 0 0;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--app-space-4);
  min-height: 240px;
}

.image-card {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
  cursor: pointer;
  transition:
    transform var(--app-transition),
    border-color var(--app-transition),
    box-shadow var(--app-transition);
}

.image-card:hover {
  transform: translateY(-2px);
  border-color: var(--app-border-strong);
  box-shadow: var(--app-shadow);
}

.image-card.selected {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft), var(--app-shadow-soft);
}

.image-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  background:
    linear-gradient(135deg, var(--app-primary-soft), transparent),
    var(--app-bg-soft);
}

.image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.selection-checkbox {
  position: absolute;
  top: var(--app-space-3);
  left: var(--app-space-3);
  z-index: 2;
  padding: 4px 7px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-small);
  background: color-mix(in srgb, var(--app-surface), transparent 10%);
  backdrop-filter: blur(12px);
}

.image-slot {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--app-space-2);
  color: var(--app-text-subtle);
  font-size: 12px;
}

.image-slot .el-icon {
  font-size: 28px;
}

.image-wrap .status-dot {
  position: absolute;
  top: var(--app-space-3);
  right: var(--app-space-3);
  padding: 5px 10px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-surface), transparent 10%);
  backdrop-filter: blur(12px);
}

.image-footer {
  display: flex;
  justify-content: space-between;
  gap: var(--app-space-3);
  padding: var(--app-space-4);
  border-top: 1px solid var(--app-border);
}

.image-footer h2 {
  margin: 0 0 var(--app-space-1);
  color: var(--app-text);
  font-family: var(--app-font-serif);
  font-size: 16px;
}

.image-footer span,
.image-footer time {
  color: var(--app-text-subtle);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

.upload-progress-panel {
  position: fixed;
  right: 18px;
  bottom: 18px;
  width: min(560px, calc(100vw - 24px));
  max-height: calc(100vh - 90px);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  color: var(--app-text);
  z-index: 2200;
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.upload-progress-panel.collapsed {
  max-height: none;
}

.upload-progress-header {
  padding: var(--app-space-3) var(--app-space-4);
  border-bottom: 1px solid var(--app-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: move;
  user-select: none;
}

.upload-progress-panel.dragging .upload-progress-header {
  cursor: grabbing;
}

.upload-progress-title {
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
}

.upload-progress-actions {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.upload-progress-body {
  display: flex;
  flex-direction: column;
  min-height: 220px;
}

.progress-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3);
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-2);
  color: var(--app-text-muted);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

.progress-bar-wrap {
  height: 8px;
  margin: 0 var(--app-space-4) var(--app-space-3);
  border-radius: 999px;
  background: var(--app-primary-soft);
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  width: 0;
  background: var(--app-accent);
  transition: width 0.25s ease;
}

.progress-logs {
  padding: var(--app-space-3) var(--app-space-4) var(--app-space-4);
  overflow-y: auto;
  max-height: calc(100vh - 250px);
  color: var(--app-text-muted);
  font-family: var(--app-font-mono);
  font-size: 12px;
  line-height: 1.6;
}

.log-item {
  margin-bottom: var(--app-space-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.log-item.ok {
  color: var(--app-status);
}

.log-item.err {
  color: var(--app-accent);
}

.highlight-card {
  margin: var(--app-space-2) 0 var(--app-space-3);
  padding: var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-control);
  background: var(--app-primary-soft);
}

.highlight-title,
.k {
  color: var(--app-text);
  font-weight: 700;
}

.highlight-row {
  margin: 2px 0;
}

.v {
  color: var(--app-text-muted);
}

.break-all {
  word-break: break-all;
}

@media (max-width: 768px) {
  .page-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    width: 100%;
    justify-content: flex-start;
  }

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
