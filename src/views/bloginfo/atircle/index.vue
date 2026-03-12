<template>
  <el-card shadow="never" class="card">
    <!-- 工具栏：搜索和添加文章按钮 -->
    <el-form :inline="true" :model="searchParams" class="toolbar">
      <!-- 文章类型输入框 -->
      <el-form-item label="文章类型：" prop="type">
        <el-input
          v-model="searchParams.type"
          placeholder="请输入文章类型"
          clearable
          class="input-width"
        />
      </el-form-item>

      <!-- 关键字输入 -->
      <el-form-item label="关键词：" prop="keyword">
        <el-input
          v-model="searchParams.keyword"
          placeholder="请输入关键词"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="fetchArticleList"
          >搜索</el-button
        >
        <el-button type="success" :icon="Plus" @click="openAddArticleDialog"
          >添加文章</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 文章信息表格 -->
    <div class="table-container">
      <el-table
        :data="paginatedArticleList"
        border
        row-key="article_id"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="article_id" label="文章ID" width="100" />
        <el-table-column prop="title" label="文章标题" min-width="120" />
        <el-table-column prop="content" label="文章内容" min-width="200" />
        <el-table-column prop="user_id" label="用户ID" min-width="100" />
        <el-table-column prop="type" label="文章类型" min-width="100" />
        <el-table-column prop="image_url" label="配图URL" min-width="160" />
        <el-table-column prop="created_at" label="创建时间" min-width="160" />
        <el-table-column prop="updated_at" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="deleteArticle(row)"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页控件 -->
    <div class="pagination-container">
      <el-pagination
        v-model:current-page="pagination.currentPage"
        layout="total, sizes, prev, pager, next, jumper"
        :total="pagination.total"
        @size-change="onSizeChange"
        @current-change="onCurrentChange"
      />
    </div>

    <!-- 编辑和新增文章对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="480px"
      :before-close="closeDialog"
    >
      <el-form
        ref="articleFormRef"
        :model="currentArticle"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="文章标题" prop="title">
          <el-input
            v-model="currentArticle.title"
            placeholder="请输入文章标题"
            clearable
          />
        </el-form-item>
        <el-form-item label="文章内容" prop="content">
          <el-input
            v-model="currentArticle.content"
            type="textarea"
            placeholder="请输入文章内容"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户ID" prop="user_id">
          <el-input
            v-model="currentArticle.user_id"
            placeholder="请输入用户ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="文章类型" prop="type">
          <el-input
            v-model="currentArticle.type"
            placeholder="请输入文章类型"
            clearable
          />
        </el-form-item>
        <el-form-item label="配图URL" prop="image_url">
          <el-input
            v-model="currentArticle.image_url"
            placeholder="请输入配图URL"
            clearable
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="created_at">
          <el-date-picker
            v-model="currentArticle.created_at"
            type="datetime"
            placeholder="选择创建时间"
          />
        </el-form-item>
        <el-form-item label="更新时间" prop="updated_at">
          <el-date-picker
            v-model="currentArticle.updated_at"
            type="datetime"
            placeholder="选择更新时间"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
const fetchArticleData = async () => {
  try {
    // 发送请求到后端获取文章数据
    const response = await axios.get('http://localhost:1031/article/articleInformationList');

    // 假设后端响应的数据是符合你给出的格式
    articleList.value = response.data.data.map(article => ({
      article_id: article.articleId,
      title: article.title,
      content: article.content,
      user_id: article.createUserId,
      type: article.category, // 假设文章类型是 category
      image_url: article.image,
      created_at: article.createTime,
      updated_at: article.updateTime
    }));

    console.log('Data fetched successfully:', paginatedArticleList.value);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchArticleData);
const searchParams = reactive({ type: "", keyword: "" });

const articleList = ref([
 // 更多文章数据
]);

const isDialogVisible = ref(false);
const dialogTitle = ref("");
const articleFormRef = ref();
const currentArticle = reactive({
  article_id: "",
  title: "",
  content: "",
  user_id: "",
  type: "",
  image_url: "",
  created_at: "",
  updated_at: ""
});
const rules = {
  title: [{ required: true, message: "请输入文章标题", trigger: "blur" }],
  content: [{ required: true, message: "请输入文章内容", trigger: "blur" }],
  user_id: [{ required: true, message: "请输入用户ID", trigger: "blur" }],
  type: [{ required: true, message: "请输入文章类型", trigger: "blur" }],
  image_url: [{ required: true, message: "请输入配图URL", trigger: "blur" }],
  created_at: [
    { required: true, message: "请选择创建时间", trigger: "change" }
  ],
  updated_at: [{ required: true, message: "请选择更新时间", trigger: "change" }]
};

// 分页参数
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10
});

// 过滤并分页显示文章数据
const filteredArticleList = computed(() => {
  return articleList.value.filter(
    article =>
      (searchParams.type ? article.type.includes(searchParams.type) : true) &&
      (searchParams.keyword
        ? article.title.includes(searchParams.keyword)
        : true)
  );
});

const paginatedArticleList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  pagination.total = filteredArticleList.value.length;
  return filteredArticleList.value.slice(start, end);
});

// 搜索功能
function fetchArticleList() {
  ElMessage.success("搜索成功！");
}

// 新增文章
function openAddArticleDialog() {
  Object.assign(currentArticle, {
    article_id: null,
    title: "",
    content: "",
    user_id: null,
    type: "",
    image_url: "",
    created_at: "",
    updated_at: ""
  });
  dialogTitle.value = "新增文章";
  isDialogVisible.value = true;
}

// 编辑文章
function openEditDialog(row) {
  Object.assign(currentArticle, row);
  dialogTitle.value = "编辑文章";
  isDialogVisible.value = true;
}

// 屬性名轉換
function transformArticleData(article) {
  return {
    articleId: article.article_id,  // 前端的 article_id 转换为 articleId
    title: article.title,
    content: article.content,
    createUserId: article.user_id,  // 前端的 user_id 转换为 createUserId
    category: article.type,         // 前端的 type 转换为 category
    image: article.image_url,       // 前端的 image_url 转换为 image
    createTime: article.created_at, // 前端的 created_at 转换为 createTime
    updateTime: article.updated_at  // 前端的 updated_at 转换为 updateTime
  };
}
// 提交表单
function submitForm() {
  articleFormRef.value.validate(valid => {
    const transformedData = transformArticleData(currentArticle);
    if (valid) {
      if (currentArticle.article_id) {
        const index = articleList.value.findIndex(
          article => article.article_id === currentArticle.article_id
        );
console.log("Request Data:", currentArticle);
        if (index !== -1) articleList.value[index] = { ...currentArticle };
        axios
          .post('http://localhost:1031/article/articleUpdata', transformedData)  // 假设后端接口为 /updateArticle
          .then(response => {
            ElMessage.success("编辑成功！");
          })
          .catch(error => {
            ElMessage.error("编辑失败！");
            console.error(error);
          });

      } else {
        articleList.value.push({ ...currentArticle, article_id: Date.now() });
        pagination.total = articleList.value.length;
            // 向后端发送新增请求
            axios
          .post('http://localhost:1031/article/articleUpdata', transformedData)  // 假设后端接口为 /addArticle
          .then(response => {
            ElMessage.success("新增文章成功！");
          })
          .catch(error => {
            // 请求失败时回滚更改
            articleList.value.pop();  // 移除新增的文章
            pagination.total = articleList.value.length;
            ElMessage.error("新增文章失败！");
            console.error(error);
          });
      }
      isDialogVisible.value = false;
      resetForm();
    }
  });
}

// 重置表单
function resetForm() {
  Object.assign(currentArticle, {
    article_id: null,
    title: "",
    content: "",
    user_id: null,
    type: "",
    image_url: "",
    created_at: "",
    updated_at: ""
  });
}

// 删除文章
function deleteArticle(row) {
  axios.post('http://localhost:1031/article/deleteArticle', row )
    .then(response => {
        const index = articleList.value.indexOf(row);
        articleList.value.splice(index, 1);
          pagination.total = articleList.value.length;
          ElMessage.success("删除成功！");
        // ElMessage.error("删除失败：" + response.data.message);
    })
    .catch(error => {
      console.error("删除课程时出错：", error);
      ElMessage.error("删除失败，请稍后重试。");
    });

}

// 分页事件
function onSizeChange(val) {
  pagination.pageSize = val;
}
function onCurrentChange(val) {
  pagination.currentPage = val;
}

// 关闭对话框
function closeDialog() {
  isDialogVisible.value = false;
  resetForm();
}
</script>

<style scoped>
.card {
  padding: 16px;
}
.toolbar {
  margin-bottom: 16px;
}
.table-container {
  margin-top: 16px;
}
.pagination-container {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
