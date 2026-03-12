<template>
  <el-card shadow="never" class="card">
    <!-- 工具栏：搜索和添加管理员按钮 -->
    <el-form :inline="true" :model="searchParams" class="toolbar">
      <el-form-item label="管理员名：" prop="username">
        <el-input
          v-model="searchParams.username"
          placeholder="请输入管理员名"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item label="手机号码：" prop="phoneNumber">
        <el-input
          v-model="searchParams.phoneNumber"
          placeholder="请输入手机号码"
          clearable
          class="input-width"
        />
      </el-form-item>

      <el-form-item>
        <el-button type="primary" :icon="Search" @click="fetchUserList"
          >搜索</el-button
        >
        <el-button type="success" :icon="Plus" @click="openAddUserDialog"
          >添加管理员</el-button
        >
      </el-form-item>
    </el-form>

    <!-- 管理员信息表格 -->
   <div class="table-container">
      <el-table
        :data="paginatedUserList"
        border
        row-key="user_id"
        style="width: 100%"
      >
        <el-table-column type="index" label="序号" width="55" />
        <el-table-column prop="user_id" label="管理员ID" min-width="100" />
        <el-table-column prop="username" label="管理员名" min-width="120" />
        <el-table-column prop="phone" label="手机号码" min-width="120" />
        <el-table-column prop="gender" label="性别" min-width="80">
          <template #default="{ row }">
            <span>{{ row.gender === "M" ? "男" : "女" }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="avatar" label="管理员头像" min-width="120">
          <template #default="{ row }">
            <el-image
              :src="row.avatar"
              alt="管理员头像"
              style="width: 50px; height: 50px"
            />
          </template>
        </el-table-column>

        <el-table-column prop="identity" label="身份类型" min-width="100">
          <template #default="{ row }">
            <span>{{ identityMap[row.identity] }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" min-width="160" />
        <el-table-column prop="update_time" label="更新时间" min-width="160" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="openEditDialog(row)"
              >编辑</el-button
            >
            <el-button type="danger" size="small" @click="deleteUser(row)"
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

    <!-- 编辑和新增管理员对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      :title="dialogTitle"
      width="480px"
      :before-close="closeDialog"
    >
      <el-form
        ref="userFormRef"
        :model="currentUser"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="管理员名" prop="username">
          <el-input
            v-model="currentUser.username"
            placeholder="请输入管理员名"
            clearable
          />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="currentUser.password"
            type="password"
            placeholder="请输入密码"
            show-password
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model="currentUser.phone"
            placeholder="请输入手机号码"
            clearable
          />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="currentUser.gender" placeholder="请选择性别">
            <el-option label="男" value="M" />
            <el-option label="女" value="F" />
          </el-select>
        </el-form-item>

        <!-- 上传管理员头像 -->
        <el-form-item label="管理员头像" >
        <!-- <el-form-item label="管理员头像" prop="avatar"> -->
          <el-upload
            action="/upload/avatar"
            :on-success="handleAvatarSuccess"
            :limit="1"
            :show-file-list="false"
          >
            <el-button>点击上传</el-button>
            <div v-if="currentUser.avatar" style="margin-top: 10px">
              <el-image
                :src="currentUser.avatar"
                alt="管理员头像"
                style="width: 100px; height: 100px"
              />
            </div>
          </el-upload>
        </el-form-item>

        <el-form-item label="身份类型" prop="identity">
          <el-input v-model="identityDisplay" :disabled="true" />
        </el-form-item>
        <el-form-item label="创建时间" prop="create_time">
          <el-date-picker
            v-model="currentUser.create_time"
            type="datetime"
            placeholder="选择创建时间"
          />
        </el-form-item>
        <el-form-item label="更新时间" prop="update_time">
          <el-date-picker
            v-model="currentUser.update_time"
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
import { ref, reactive, computed, onMounted} from "vue";
import { ElMessage } from "element-plus";
import { Search, Plus } from "@element-plus/icons-vue";
import axios from 'axios';
const searchParams = reactive({ username: "", phoneNumber: "" });

const userList = ref([
]);
const fetchUserData = async () => {
  try {
    const response = await axios.get('http://localhost:1031/user/userInformationList');
    userList.value = response.data.data.map(user => ({
      user_id: user.userId,
      username: user.username,
      phone: user.phone,
      gender: user.gender,
      avatar: user.avatar,
      create_time: user.createTime,
      update_time: user.updateTime,
      identity: user.identity
    })); // 映射后端返回的数据
    console.log('Data fetched successfully:', userList.value);
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

onMounted(fetchUserData);
const identityMap = { 0: "管理员", 1: "教师", 2: "客户" };

const isDialogVisible = ref(false);
const dialogTitle = ref("");
const userFormRef = ref();
const currentUser = reactive({
  user_id: null,
  username: "",
  password: "",
  phone: "",
  gender: "M",
  avatar: "aou=ictur",
  identity: 0,
  create_time: "",
  update_time: ""
});
const rules = {
  username: [{ required: true, message: "请输入管理员名", trigger: "blur" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" }
  ],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  avatar: [
    { required: true, message: "请上传管理员头像", trigger: "blur" }
  ],
  identity: [{ required: true, message: "请选择身份类型", trigger: "change" }],
  create_time: [
    { required: true, message: "请选择创建时间", trigger: "change" }
  ],
  update_time: [{ required: true, message: "请选择更新时间", trigger: "change" }]
};
// 身份类型的显示文本
const identityDisplay = computed(() => {
  // return currentUser.identity === 0 ? "管理员" : "管理员";
  return identityMap[currentUser.identity];

});

// 头像上传成功后处理
function handleAvatarSuccess(response) {
  currentUser.avatar = response.url; // 假设服务器返回 URL 字段
  ElMessage.success("头像上传成功！");
}

// 分页参数
const pagination = reactive({
  total: 0,
  currentPage: 1,
  pageSize: 10
});

// 过滤并分页显示管理员数据
const filteredUserList = computed(() => {
  return userList.value.filter(
    user =>
    user.identity === 0 &&
      (searchParams.username
        ? user.username.includes(searchParams.username)
        : true) &&
      (searchParams.phoneNumber
        ? user.phone.includes(searchParams.phoneNumber)
        : true)
  );
});

const paginatedUserList = computed(() => {
  const start = (pagination.currentPage - 1) * pagination.pageSize;
  const end = start + pagination.pageSize;
  // eslint-disable-next-line vue/no-side-effects-in-computed-properties
  pagination.total = filteredUserList.value.length;
  return filteredUserList.value.slice(start, end);
});

// 搜索功能
function fetchUserList() {
  ElMessage.success("搜索成功！");
}

// 新增管理员
function openAddUserDialog() {
  Object.assign(currentUser, {
    user_id: null,
    username: "",
    password: "",
    phone: "",
    gender: "M",
    avatar: "apicturw",
    identity: 0,
    create_time: "",
    update_time: ""
  });
  dialogTitle.value = "新增管理员";
  isDialogVisible.value = true;
}

// 编辑管理员
function openEditDialog(row) {
  Object.assign(currentUser, row);
  dialogTitle.value = "编辑管理员";
  isDialogVisible.value = true;
}

// 提交表单
function submitForm() {
  userFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        if (currentUser.user_id) {
          // 更新用户
          const index = userList.value.findIndex(
            (user) => user.user_id === currentUser.user_id
          );
          if (index !== -1) {
            // 发送更新请求到后端
            // await axios.put(`/api/users/${currentUser.user_id}`, currentUser);
            const response = await axios.post("http://localhost:1031/user/updataUser", currentUser);
            Object.assign(userList.value[index], currentUser);
            ElMessage.success("管理员信息更新成功！");
          }
        } else {
          // 新增用户
          // 发送新增请求到后端
          const response = await axios.post("http://localhost:1031/user/updataUser", currentUser);
          // 使用后端返回的数据（如有需要）
          userList.value.push({ ...response.data });
          ElMessage.success("管理员新增成功！");
        }
        isDialogVisible.value = false;
      } catch (error) {
        ElMessage.error("提交失败，请重试！");
        console.error("提交表单错误:", error);
      }
    }
  });
}
// 删除管理员
function deleteUser(row) {

   const userId = row.user_id;
  // 发送 POST 请求删除数据
  axios
    .post('http://localhost:1031/user/deleteUser', { user_id: userId })  // 假设接口为 /delete
    .then(response => {
      // 如果删除成功，更新本地数据
      const index = userList.value.findIndex(user => user.user_id === userId);
      if (index !== -1) {
        userList.value.splice(index, 1);
        pagination.total = userList.value.length;
        ElMessage.success("删除成功！");
      }
    })
    .catch(error => {
      ElMessage.error("删除失败！");
      console.error("删除失败:", error);
    });
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
  userFormRef.value.resetFields();
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
.input-width {
  width: 200px;
}
</style>
