<template>
  <section class="projects-page">
    <div class="projects-hero">
      <div>
        <span class="archive-kicker">Archive Projects</span>
        <h1 class="archive-title">侨批文献项目组</h1>
        <p class="archive-subtitle">
          管理 OCR 识别、人工校注与结构化复核任务，为每批侨批文献建立清晰的标注工作流。
        </p>
      </div>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建项目</el-button>
    </div>

    <div v-loading="loading" class="project-grid">
      <el-empty v-if="!loading && projectList.length === 0" description="暂无项目组" />

      <article
        v-for="item in projectList"
        :key="item.id"
        class="project-card"
        @click="goToDetail(item.id)"
      >
        <div class="project-card-top">
          <span class="project-mark">侨</span>
          <span class="status-dot processing">档案项目</span>
        </div>
        <h2>{{ item.projectName }}</h2>
        <div class="project-owner">
          <span>所有者</span>
          <strong>{{ getOwnerLabel(item) }}</strong>
        </div>
        <p>{{ item.description || "暂无描述" }}</p>
        <footer>
          <span>ID {{ item.id }}</span>
          <time>{{ item.createTime }}</time>
        </footer>
      </article>
    </div>

    <el-dialog
      v-model="dialogVisible"
      title="创建项目"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-position="top">
        <el-form-item label="项目名称" prop="projectName">
          <el-input v-model="form.projectName" placeholder="请输入项目名称" clearable />
        </el-form-item>
        <el-form-item label="项目描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="4"
            placeholder="请输入项目描述"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitCreate">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import { createProject, getProjectList, type ProjectItem } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import { useRouter } from "vue-router";
import { READONLY_MESSAGE, assertWritable } from "@/utils/permission";

defineOptions({ name: "classinfo" });

const router = useRouter();
const userStore = useUserStoreHook();
const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const projectList = ref<ProjectItem[]>([]);
const currentUser = computed(() => ({
  id: userStore.userId,
  role: userStore.role
}));

const form = reactive({
  projectName: "",
  description: ""
});

const rules = {
  projectName: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 1, max: 50, message: "项目名称不能超过 50 个字符", trigger: "blur" }
  ]
};

function goToDetail(id: string | number) {
  router.push(`/classinfo/detail/${id}`);
}

function getOwnerLabel(item: ProjectItem) {
  return item.ownerName || (item.ownerId ? `用户 ${item.ownerId}` : "未知");
}

async function fetchProjects() {
  const userId = userStore.userId;
  if (!userId) {
    ElMessage.warning("无法获取用户信息，请重新登录");
    return;
  }
  loading.value = true;
  try {
    const res = await getProjectList(userId);
    if (res.code === 200) {
      projectList.value = res.data ?? [];
    } else {
      ElMessage.error(res.msg || "获取项目列表失败");
    }
  } catch {
    ElMessage.error("请求失败，请检查网络");
  } finally {
    loading.value = false;
  }
}

function openCreateDialog() {
  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }
  form.projectName = "";
  form.description = "";
  dialogVisible.value = true;
}

async function submitCreate() {
  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }

  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  submitting.value = true;
  try {
    const res = await createProject({
      projectName: form.projectName,
      userId: userStore.userId,
      description: form.description
    });
    if (res.code === 200) {
      ElMessage.success("项目创建成功");
      dialogVisible.value = false;
      projectList.value.unshift(res.data);
    } else {
      ElMessage.error(res.msg || "创建失败");
    }
  } catch {
    ElMessage.error("请求失败，请检查网络");
  } finally {
    submitting.value = false;
  }
}

onMounted(() => fetchProjects());
</script>

<style scoped>
.projects-page {
  max-width: 1280px;
  margin: 0 auto;
}

.projects-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--app-space-6);
  margin-bottom: var(--app-space-8);
}

.projects-hero .archive-subtitle {
  max-width: 620px;
  margin: var(--app-space-3) 0 0;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--app-space-4);
  min-height: 240px;
}

.project-card {
  min-height: 220px;
  display: flex;
  flex-direction: column;
  padding: var(--app-space-6);
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

.project-card:hover {
  transform: translateY(-2px);
  border-color: var(--app-border-strong);
  box-shadow: var(--app-shadow);
}

.project-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--app-space-6);
}

.project-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  color: var(--app-accent);
  background: var(--app-primary-soft);
  font-family: var(--app-font-serif);
  font-size: 20px;
  font-weight: 800;
}

.project-card h2 {
  margin: 0;
  color: var(--app-text);
  font-family: var(--app-font-serif);
  font-size: 22px;
  line-height: 1.35;
}

.project-owner {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
  margin-top: var(--app-space-3);
  color: var(--app-text-muted);
  font-size: 13px;
}

.project-owner strong {
  color: var(--app-text);
  font-weight: 700;
}

.project-card p {
  flex: 1;
  margin: var(--app-space-3) 0 var(--app-space-6);
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1.8;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-card footer {
  display: flex;
  justify-content: space-between;
  gap: var(--app-space-3);
  color: var(--app-text-subtle);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

@media (max-width: 720px) {
  .projects-hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
