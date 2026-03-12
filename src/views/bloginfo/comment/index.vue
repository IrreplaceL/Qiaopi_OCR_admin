<template>
  <el-card shadow="never" class="card">
    <!-- 工具栏：搜索和添加评论按钮 -->
    <el-form :inline="true" :model="searchParams" class="toolbar">
      <el-form-item label="文章ID：" prop="articleId">
        <el-input
          v-model="searchParams.articleId"
          placeholder="请输入文章ID"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item label="用户ID：" prop="userId">
        <el-input
          v-model="searchParams.userId"
          placeholder="请输入用户ID"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="fetchCommentList"
          >搜索</el-button
        >
        <el-button type="success" :icon="Plus" @click="openAddCommentDialog"
          >添加评论</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 评论信息表格 -->
    <div class="table-container">
      <el-table
        :data="commentList"
        border
        row-key="comment_id"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="comment_id" label="评论ID" min-width="100" />
        <el-table-column prop="article_id" label="文章ID" min-width="100" />
        <el-table-column prop="comment_user_id" label="用户ID" min-width="100" />
        <el-table-column prop="image" label="文章配图URL" min-width="200" />
        <el-table-column prop="content" label="评论内容" min-width="200" />
        <el-table-column prop="created_at" label="创建时间" min-width="160" />
        <el-table-column prop="updated_at" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="deleteComment(row)"
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

    <!-- 编辑和新增评论对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="480px"
      :before-close="closeDialog"
    >
      <el-form
        ref="commentFormRef"
        :model="currentComment"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="评论ID" prop="comment_id">
          <el-input v-model="currentComment.comment_id" disabled />
        </el-form-item>
        <el-form-item label="文章ID" prop="article_id">
          <el-input
            v-model="currentComment.article_id"
            placeholder="请输入文章ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="用户ID" prop="comment_user_id">
          <el-input
            v-model="currentComment.comment_user_id"
            placeholder="请输入用户ID"
            clearable
          />
        </el-form-item>
        <el-form-item label="文章配图URL" prop="image">
          <el-input
            v-model="currentComment.image"
            placeholder="请输入文章配图URL"
            clearable
          />
        </el-form-item>
        <el-form-item label="评论内容" prop="content">
          <el-input
            v-model="currentComment.content"
            type="textarea"
            placeholder="请输入评论内容"
            clearable
          />
        </el-form-item>
        <el-form-item label="创建时间" prop="created_at">
          <el-date-picker
            v-model="currentComment.created_at"
            type="datetime"
            placeholder="选择创建时间"
          />
        </el-form-item>
        <el-form-item label="更新时间" prop="updated_at">
          <el-date-picker
            v-model="currentComment.updated_at"
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
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import axios from 'axios';
import {  onMounted } from 'vue';

const searchParams = reactive({ articleId: "", userId: "" });

const commentList = ref([
 // 更多评论数据
]);

const isDialogVisible = ref(false);
const dialogTitle = ref("");
const commentFormRef = ref();
const currentComment = reactive({
  comment_id: null,
  article_id: "",
  comment_user_id: "",
  image: "",
  content: "",
  created_at: "",
  updated_at: ""
});
const rules = {
  article_id: [{ required: true, message: "请输入文章ID", trigger: "blur" }],
  comment_user_id: [{ required: true, message: "请输入用户ID", trigger: "blur" }],
  image: [
    { required: true, message: "请输入文章配图URL", trigger: "blur" }
  ],
  content: [{ required: true, message: "请输入评论内容", trigger: "blur" }],
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

const fetchArticleData = async () => {
  try {
    // 发送请求到后端获取文章数据
    const response = await axios.get('http://localhost:1031/comment/commentListInformation');

    // 假设后端响应的数据是符合你给出的格式
    commentList.value = response.data.data.map(item => ({
        comment_id: item.commentId,
        article_id: item.articleId,
        comment_user_id: item.commentUserId,
        content: item.content,
        created_at: item.createTime,
        updated_at: item.updateTime,
        // 其他字段可以继续映射
      }));
    // console.log('Data fetched successfully:', paginatedCommentList.value);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchArticleData);

// 过滤并分页显示评论数据
const filteredCommentList = computed(() => {
  return commentList.value.filter(
    comment =>
      (searchParams.articleId
        ? comment.article_id.toString().includes(searchParams.articleId)
        : true) &&
      (searchParams.userId
        ? comment.comment_user_id.includes(searchParams.userId)
        : true)
  );
});

const paginatedCommentList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  pagination.total = filteredCommentList.value.length;
  return filteredCommentList.value.slice(start, end);
});

// 搜索功能
function fetchCommentList() {
  ElMessage.success("搜索成功！");
}

// 新增评论
function openAddCommentDialog() {
  Object.assign(currentComment, {
    comment_id: null,
    article_id: "",
    comment_user_id: "",
    image: "",
    content: "",
    created_at: "",
    updated_at: ""
  });
  dialogTitle.value = "新增评论";
  isDialogVisible.value = true;
}

// 编辑评论
function openEditDialog(row) {
  Object.assign(currentComment, row);
  dialogTitle.value = "编辑评论";
  isDialogVisible.value = true;
}

// 提交表单
function submitForm() {
  commentFormRef.value.validate(valid => {
    if (valid) {
      if (currentComment.comment_id) {
        const index = commentList.value.findIndex(
          comment => comment.comment_id === currentComment.comment_id
        );
        if (index !== -1) commentList.value[index] = { ...currentComment };
        axios
          .post('http://localhost:1031/comment/updataComment', currentComment)  // 假设后端接口为 /updateArticle
          .then(response => {
            ElMessage.success("编辑成功！");
          })
          .catch(error => {
            ElMessage.error("编辑失败！");
            console.error(error);
          });


      } else {
        commentList.value.push({ ...currentComment });
        pagination.total = commentList.value.length;
        axios
          .post('http://localhost:1031/comment/updataComment', currentComment)  // 假设后端接口为 /addArticle
          .then(response => {
            ElMessage.success("新增评论成功！");
          })
          .catch(error => {
            // 请求失败时回滚更改
            commentList.value.pop();  // 移除新增的文章
            pagination.total = commentList.value.length;
            ElMessage.error("新增评论失败！");
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
  Object.assign(currentComment, {
    comment_id: null,
    article_id: "",
    comment_user_id: "",
    image: "",
    content: "",
    created_at: "",
    updated_at: ""
  });
}

// 删除评论
function deleteComment(row) {
  const index = commentList.value.findIndex(
    comment => comment.comment_id === row.comment_id
  );
  if (index !== -1) {
    commentList.value.splice(index, 1);
    pagination.total = commentList.value.length;
    ElMessage.success("删除成功！");
  }
}

// 分页事件
function onSizeChange(size) {
  pagination.pageSize = size;
}

function onCurrentChange(page) {
  pagination.currentPage = page;
}

// 关闭对话框
function closeDialog() {
  isDialogVisible.value = false;
  resetForm();
}
</script>

<style scoped>
.card {
  margin: 20px;
}

.toolbar {
  margin-bottom: 20px;
}

.table-container {
  margin-bottom: 20px;
}

.pagination-container {
  text-align: right;
}
</style>
