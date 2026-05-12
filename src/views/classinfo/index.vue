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
      <div class="hero-actions">
        <el-button :icon="selectionMode ? Close : Check" @click="toggleSelectionMode">
          {{ selectionMode ? "退出多选" : "多选" }}
        </el-button>
        <el-button
          v-if="selectionMode"
          type="danger"
          :icon="Delete"
          :loading="deleting"
          @click="deleteSelectedProjects"
        >
          删除所选
        </el-button>
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建项目</el-button>
      </div>
    </div>

    <div v-loading="loading" class="project-grid">
      <el-empty v-if="!loading && projectList.length === 0" description="暂无项目组" />

      <article
        v-for="item in projectList"
        :key="item.id"
        :class="['project-card', { selected: isProjectSelected(item.id) }]"
        @click="handleProjectCardClick(item)"
      >
        <div class="project-card-top">
          <span class="project-mark">侨</span>
          <el-checkbox
            v-if="selectionMode"
            :model-value="isProjectSelected(item.id)"
            @click.stop
            @change="toggleProjectSelection(item.id)"
          />
          <span class="status-dot processing">档案项目</span>
        </div>
        <h2>{{ item.projectName }}</h2>
        <div class="project-owner">
          <span>所有者</span>
          <strong>{{ getOwnerLabel(item) }}</strong>
        </div>
        <p>{{ item.description || "暂无描述" }}</p>
        <footer>
          <div>
            <span>ID {{ item.id }}</span>
            <time>{{ item.createTime }}</time>
          </div>
          <el-button link :icon="Edit" @click.stop="openEditDialog(item)">编辑</el-button>
        </footer>
      </article>
    </div>

    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
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
        <el-button type="primary" :loading="submitting" @click="submitProject">确定</el-button>
      </template>
    </el-dialog>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Check, Close, Delete, Edit, Plus } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import {
  createProject,
  deleteProjects,
  getProjectList,
  updateProject,
  type ProjectItem
} from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import { useRouter } from "vue-router";
import { READONLY_MESSAGE, assertWritable } from "@/utils/permission";

defineOptions({ name: "classinfo" });

const router = useRouter();
const userStore = useUserStoreHook();
const loading = ref(false);
const submitting = ref(false);
const deleting = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const projectList = ref<ProjectItem[]>([]);
const selectionMode = ref(false);
const selectedProjectIds = ref<string[]>([]);
const dialogMode = ref<"create" | "edit">("create");
const editingProjectId = ref<string | number>("");
const currentUser = computed(() => ({
  id: userStore.userId,
  role: userStore.role
}));
const dialogTitle = computed(() =>
  dialogMode.value === "create" ? "创建项目" : "编辑项目"
);

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

function handleProjectCardClick(item: ProjectItem) {
  if (selectionMode.value) {
    toggleProjectSelection(item.id);
    return;
  }
  goToDetail(item.id);
}

function getOwnerLabel(item: ProjectItem) {
  return item.ownerName || (item.ownerId ? `用户 ${item.ownerId}` : "未知");
}

function isProjectOwner(item: ProjectItem) {
  return String(item.ownerId ?? "") === String(userStore.userId);
}

function isProjectSelected(id: string | number) {
  return selectedProjectIds.value.includes(String(id));
}

function toggleSelectionMode() {
  selectionMode.value = !selectionMode.value;
  selectedProjectIds.value = [];
}

function toggleProjectSelection(id: string | number) {
  const normalizedId = String(id);
  selectedProjectIds.value = isProjectSelected(normalizedId)
    ? selectedProjectIds.value.filter(item => item !== normalizedId)
    : [...selectedProjectIds.value, normalizedId];
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
  dialogMode.value = "create";
  editingProjectId.value = "";
  dialogVisible.value = true;
}

function openEditDialog(item: ProjectItem) {
  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }
  if (!isProjectOwner(item)) {
    ElMessage.warning("只能修改自己拥有的项目组");
    return;
  }

  dialogMode.value = "edit";
  editingProjectId.value = item.id;
  form.projectName = item.projectName;
  form.description = item.description || "";
  dialogVisible.value = true;
}

async function submitProject() {
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
    const payload = {
      projectName: form.projectName,
      userId: userStore.userId,
      description: form.description
    };
    const res =
      dialogMode.value === "create"
        ? await createProject(payload)
        : await updateProject({
            ...payload,
            projectId: editingProjectId.value
          });
    if (res.code === 200) {
      dialogVisible.value = false;
      if (dialogMode.value === "create") {
        projectList.value.unshift(res.data);
        ElMessage.success("项目创建成功");
      } else {
        projectList.value = projectList.value.map(item =>
          String(item.id) === String(editingProjectId.value) ? res.data : item
        );
        ElMessage.success("项目已更新");
      }
    } else {
      ElMessage.error(res.msg || (dialogMode.value === "create" ? "创建失败" : "更新失败"));
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "请求失败，请检查网络");
  } finally {
    submitting.value = false;
  }
}

async function deleteSelectedProjects() {
  if (!selectedProjectIds.value.length) {
    ElMessage.warning("请先选择要删除的项目组");
    return;
  }

  try {
    assertWritable(currentUser.value);
  } catch {
    ElMessage.warning(READONLY_MESSAGE);
    return;
  }

  const selectedProjects = projectList.value.filter(item =>
    selectedProjectIds.value.includes(String(item.id))
  );
  if (selectedProjects.some(item => !isProjectOwner(item))) {
    ElMessage.warning("只能删除自己拥有的项目组");
    return;
  }

  try {
    await ElMessageBox.confirm(
      "项目组所属的标注也会一并删除，是否确定删除？",
      "删除项目组",
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
    const res = await deleteProjects({
      userId: userStore.userId,
      ids: selectedProjectIds.value
    });
    if (res.code !== 200) {
      ElMessage.error(res.msg || "删除项目组失败");
      return;
    }
    const deletedIds = new Set(selectedProjectIds.value);
    projectList.value = projectList.value.filter(item => !deletedIds.has(String(item.id)));
    selectedProjectIds.value = [];
    selectionMode.value = false;
    ElMessage.success("项目组已删除");
  } catch (error: any) {
    ElMessage.error(error?.message || "删除项目组失败");
  } finally {
    deleting.value = false;
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

.hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: var(--app-space-3);
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

.project-card.selected {
  border-color: var(--app-accent);
  box-shadow: 0 0 0 2px var(--app-accent-soft), var(--app-shadow-soft);
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
  align-items: center;
  justify-content: space-between;
  gap: var(--app-space-3);
  color: var(--app-text-subtle);
  font-family: var(--app-font-mono);
  font-size: 12px;
}

.project-card footer div {
  display: flex;
  flex-direction: column;
  gap: var(--app-space-1);
}

.project-card footer :deep(.el-button) {
  font-family: var(--app-font-sans);
}

@media (max-width: 720px) {
  .projects-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .hero-actions {
    justify-content: flex-start;
  }
}
</style>
