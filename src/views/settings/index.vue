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
          <el-tag :type="userStore.isAdmin ? 'success' : 'info'" effect="plain">
            {{ userStore.isAdmin ? "admin 可保存" : "只读查看" }}
          </el-tag>
        </div>
      </template>

      <el-input
        v-model="promptContent"
        type="textarea"
        :autosize="{ minRows: 18, maxRows: 32 }"
        placeholder="正在加载提示词..."
      />

      <footer class="settings-meta">
        <span>当前用户：{{ userStore.nickname || userStore.username || "未知用户" }}</span>
        <span v-if="promptConfig?.updateTime">更新时间：{{ promptConfig.updateTime }}</span>
      </footer>
    </el-card>
  </section>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
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
