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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { ArrowLeft, Loading, PictureFilled  } from "@element-plus/icons-vue";
import { getAnnotationList, type AnnotationItem } from "@/api/user";

defineOptions({ name: "classinfoDetail" });

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const list = ref<AnnotationItem[]>([]);

const projectId = route.params.projectId as string;

const annotatedCount = computed(() => list.value.filter(i => i.annotated).length);
const previewList = computed(() => list.value.map(i => i.imageUrl));

function goToAnnotationNew() {
  router.push(`/classinfo/detail/${projectId}/annotation/new`);
}

function goToAnnotationDetail(id: string) {
  router.push(`/classinfo/detail/${projectId}/annotation/${id}`);
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
</style>
