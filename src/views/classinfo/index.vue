<template>
  <el-card shadow="never">
    <!-- 工具栏 -->
    <div class="toolbar">
      <span class="title">识别组列表</span>
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">创建项目</el-button>
    </div>

    <!-- 项目卡片列表 -->
    <div v-loading="loading" class="project-grid">
      <el-empty v-if="!loading && projectList.length === 0" description="暂无项目组，快去创建吧" />
      <div
        v-for="item in projectList"
        :key="item.id"
        class="project-card-wrapper"
        @click="goToDetail(item.id)"
      >
      <el-card
        shadow="hover"
        class="project-card"
      >
        <template #header>
          <div class="card-header">
            <el-icon class="card-icon"><Folder /></el-icon>
            <span class="card-title">{{ item.projectName }}</span>
          </div>
        </template>
        <p class="card-desc">{{ item.description || '暂无描述' }}</p>
        <div class="card-footer">
          <span class="card-time">
            <el-icon><Clock /></el-icon>
            {{ item.createTime }}
          </span>
        </div>
      </el-card>
      </div>
    </div>

    <!-- 创建项目对话框 -->
    <el-dialog
      v-model="dialogVisible"
      title="创建项目"
      width="480px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <el-form-item label="项目名称" prop="projectName">
          <el-input
            v-model="form.projectName"
            placeholder="请输入项目名称"
            clearable
          />
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
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, Folder, Clock } from "@element-plus/icons-vue";
import type { FormInstance } from "element-plus";
import { getProjectList, createProject } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";
import { useRouter } from "vue-router";

defineOptions({ name: "classinfo" });

const router = useRouter();

const loading = ref(false);
const submitting = ref(false);
const dialogVisible = ref(false);
const formRef = ref<FormInstance>();
const projectList = ref([]);

function goToDetail(id: string | number) {
  console.log('跳转id:', id)  // 看看id是否为空/undefined
  router.push(`/classinfo/detail/${id}`)
}
const form = reactive({
  projectName: "",
  description: ""
});

const rules = {
  projectName: [
    { required: true, message: "请输入项目名称", trigger: "blur" },
    { min: 1, max: 50, message: "项目名称不能超过50个字符", trigger: "blur" }
  ]
};

async function fetchProjects() {
  const userId = useUserStoreHook().userId;
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
  form.projectName = "";
  form.description = "";
  dialogVisible.value = true;
}

async function submitCreate() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  const userId = useUserStoreHook().userId;
  submitting.value = true;
  try {
    const res = await createProject({
      projectName: form.projectName,
      userId: userId,
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
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  min-height: 200px;
}

.project-card-wrapper {
  cursor: pointer;
}

.project-card {
  transition: transform 0.2s;
}

.project-card:hover {
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-icon {
  font-size: 20px;
  color: var(--el-color-primary);
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-desc {
  color: var(--el-text-color-secondary);
  font-size: 13px;
  line-height: 1.6;
  margin: 0 0 12px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-footer {
  display: flex;
  align-items: center;
}

.card-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}
</style>
