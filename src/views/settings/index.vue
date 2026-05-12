<template>
  <section class="settings-page">
    <div class="settings-hero">
      <div>
        <span class="archive-kicker">Settings</span>
        <h1 class="archive-title">系统设置</h1>
        <p class="archive-subtitle">
          查看侨批 AI 标注提示词；只有 admin 用户可以保存修改。
        </p>
      </div>
      <el-button type="primary" :loading="saving" @click="savePrompt">
        保存提示词
      </el-button>
    </div>

    <el-card v-loading="loading" class="settings-card" shadow="never">
      <template #header>
        <div class="card-header">
          <div>
            <strong>{{ promptConfig?.promptName || "侨批 AI 标注提示词" }}</strong>
            <span>{{ promptConfig?.promptKey || "qiaopi_annotation_prompt" }}</span>
          </div>
          <span :class="['permission-badge', { writable: userStore.isAdmin }]">
            {{ userStore.isAdmin ? "admin 可保存" : "只读查看" }}
          </span>
        </div>
      </template>

      <div class="prompt-markdown" v-html="renderedPrompt"></div>
      <el-input
        v-if="userStore.isAdmin"
        v-model="promptContent"
        class="prompt-editor"
        type="textarea"
        :autosize="{ minRows: 12, maxRows: 22 }"
        placeholder="请使用 Markdown 格式编辑提示词..."
      />

      <footer class="settings-meta">
        <span>当前用户：{{ userStore.nickname || userStore.username || "未知用户" }}</span>
        <span v-if="promptConfig?.updateTime">更新时间：{{ promptConfig.updateTime }}</span>
      </footer>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { ElMessage } from "element-plus";
import {
  getQiaopiPrompt,
  updateQiaopiPrompt,
  type AiPromptConfig
} from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({ name: "Settings" });

const userStore = useUserStoreHook();
const loading = ref(false);
const saving = ref(false);
const promptConfig = ref<AiPromptConfig | null>(null);
const promptContent = ref("");
const renderedPrompt = computed(() => renderMarkdown(promptContent.value));

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderInlineMarkdown(value: string) {
  return escapeHtml(value)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>");
}

function renderMarkdown(markdown: string) {
  if (!markdown.trim()) {
    return '<p class="empty-prompt">暂无提示词内容</p>';
  }

  return markdown
    .split(/\r?\n/)
    .map(line => {
      if (line.startsWith("#### ")) return `<h4>${renderInlineMarkdown(line.slice(5))}</h4>`;
      if (line.startsWith("### ")) return `<h3>${renderInlineMarkdown(line.slice(4))}</h3>`;
      if (line.startsWith("## ")) return `<h2>${renderInlineMarkdown(line.slice(3))}</h2>`;
      if (line.startsWith("# ")) return `<h1>${renderInlineMarkdown(line.slice(2))}</h1>`;
      if (/^\s*[-*]\s+/.test(line)) {
        return `<p class="md-list-item">${renderInlineMarkdown(line.replace(/^\s*[-*]\s+/, ""))}</p>`;
      }
      if (!line.trim()) return '<div class="md-space"></div>';
      return `<p>${renderInlineMarkdown(line)}</p>`;
    })
    .join("");
}

async function loadPrompt() {
  loading.value = true;
  try {
    const res = await getQiaopiPrompt();
    if (res.code !== 200) {
      ElMessage.error(res.msg || "获取提示词失败");
      return;
    }
    promptConfig.value = res.data;
    promptContent.value = res.data?.promptContent || "";
  } catch (error: any) {
    ElMessage.error(error?.message || "获取提示词失败");
  } finally {
    loading.value = false;
  }
}

async function savePrompt() {
  if (!userStore.isAdmin) {
    ElMessage.warning("只有 admin 用户可以修改提示词");
    return;
  }
  if (!promptContent.value.trim()) {
    ElMessage.warning("提示词内容不能为空");
    return;
  }

  saving.value = true;
  try {
    const res = await updateQiaopiPrompt({
      userId: userStore.userId,
      promptContent: promptContent.value
    });
    if (res.code !== 200) {
      ElMessage.error(res.msg || "保存提示词失败");
      return;
    }
    promptConfig.value = res.data;
    promptContent.value = res.data?.promptContent || promptContent.value;
    ElMessage.success("提示词已保存");
  } catch (error: any) {
    ElMessage.error(error?.message || "保存提示词失败");
  } finally {
    saving.value = false;
  }
}

onMounted(() => {
  loadPrompt();
});
</script>

<style scoped>
.settings-page {
  max-width: 1080px;
  margin: 0 auto;
}

.settings-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--app-space-6);
  margin-bottom: var(--app-space-8);
}

.settings-hero .archive-subtitle {
  max-width: 560px;
  margin: var(--app-space-3) 0 0;
}

.settings-card {
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow-soft);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-4);
}

.card-header strong,
.card-header span {
  display: block;
}

.card-header span {
  margin-top: var(--app-space-1);
  color: var(--app-text-muted);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

.permission-badge {
  flex: 0 0 auto;
  max-width: 96px;
  min-height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  color: var(--app-text-muted);
  font-family: var(--app-font-sans);
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.permission-badge.writable {
  border-color: color-mix(in srgb, var(--app-status), transparent 55%);
  color: var(--app-status);
}

.prompt-markdown {
  min-height: 420px;
  max-height: 58vh;
  overflow: auto;
  padding: var(--app-space-4);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-control);
  background: var(--app-surface);
  color: var(--app-text);
  font-family: var(--app-font-serif);
  line-height: 1.85;
}

.prompt-markdown :deep(h1),
.prompt-markdown :deep(h2),
.prompt-markdown :deep(h3),
.prompt-markdown :deep(h4),
.prompt-markdown :deep(p) {
  margin: 0 0 var(--app-space-3);
}

.prompt-markdown :deep(h1),
.prompt-markdown :deep(h2),
.prompt-markdown :deep(h3),
.prompt-markdown :deep(h4) {
  font-family: var(--app-font-serif);
  color: var(--app-text);
}

.prompt-markdown :deep(code) {
  padding: 2px 5px;
  border-radius: 4px;
  background: var(--app-primary-soft);
  font-family: var(--app-font-mono);
  font-size: 0.92em;
}

.prompt-markdown :deep(.md-list-item) {
  padding-left: var(--app-space-4);
  position: relative;
}

.prompt-markdown :deep(.md-list-item)::before {
  position: absolute;
  left: 0;
  content: "•";
  color: var(--app-accent);
}

.prompt-markdown :deep(.md-space) {
  height: var(--app-space-2);
}

.prompt-markdown :deep(.empty-prompt) {
  color: var(--app-text-subtle);
}

.prompt-editor {
  margin-top: var(--app-space-4);
}

.settings-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-4);
  margin-top: var(--app-space-4);
  color: var(--app-text-muted);
  font-size: 13px;
}

@media (max-width: 720px) {
  .settings-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .card-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
