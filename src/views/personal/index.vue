<template>
  <el-card shadow="never" class="card">
    <h3>个人信息</h3>

    <!-- 个人信息展示 -->
    <div class="info-container">
      <el-row>
        <el-col :span="8">
          <el-form-item label="头像">
            <el-image
              :src="userInfo.avatar || defaultAvatarUrl"
              alt="个人头像"
              style="width: 100px; height: 100px"
            />
          </el-form-item>
        </el-col>
        <el-col :span="16">
          <el-form-item label="用户名">
            <span>{{ userInfo.username }}</span>
          </el-form-item>
          <el-form-item label="手机号码">
            <span>{{ userInfo.phone }}</span>
          </el-form-item>
          <el-form-item label="性别">
            <span>{{ userInfo.gender === "M" ? "男" : "女" }}</span>
          </el-form-item>
          <el-form-item label="身份类型">
            <span>{{ identityMap[userInfo.identity] }}</span>
          </el-form-item>
        </el-col>
      </el-row>
    </div>

    <!-- 编辑按钮 -->
    <el-button type="primary" @click="openEditDialog">编辑个人信息</el-button>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="isDialogVisible"
      title="编辑个人信息"
      width="500px"
      :before-close="closeDialog"
    >
      <el-form
        ref="userFormRef"
        :model="editUserInfo"
        :rules="rules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="editUserInfo.username"
            placeholder="请输入用户名"
          />
        </el-form-item>
        <el-form-item label="手机号码" prop="phone">
          <el-input
            v-model="editUserInfo.phone"
            placeholder="请输入手机号码"
          />
        </el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-select v-model="editUserInfo.gender" placeholder="请选择性别">
            <el-option label="男" value="M" />
            <el-option label="女" value="F" />
          </el-select>
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input
            v-model="editUserInfo.password"
            :type="passwordVisible ? 'text' : 'password'"
            placeholder="请输入密码"
            show-password
          >
            <template #suffix>
              <el-icon
                :icon="passwordVisible ? 'Eye' : 'EyeClosed'"
                @click="togglePasswordVisibility"
              />
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="头像" >
        <!-- <el-form-item label="头像" prop="avatar"> -->
          <el-upload
            action="/upload/avatar"
            :on-success="handleAvatarSuccess"
            :limit="1"
            :show-file-list="false"
          >
            <el-button>上传头像</el-button>
            <div v-if="editUserInfo.avatar" style="margin-top: 10px">
              <el-image
                :src="editUserInfo.avatar"
                alt="个人头像"
                style="width: 100px; height: 100px"
              />
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { ElMessage } from "element-plus";

const defaultAvatarUrl = "http://example.com/default-avatar.jpg"; // 默认头像 URL
const userInfo = reactive({
  userId: 1,
  username: "小铭",
  phone: "13800138000",
  gender: "M",
  avatar: "",
  identity: 0, // 0:管理员, 1:教师, 2:客户
  password: "password123" // 密码字段
});

const identityMap = { 0: "管理员", 1: "教师", 2: "客户" };
const editUserInfo = reactive({ ...userInfo });
const isDialogVisible = ref(false);
const userFormRef = ref();

const rules = {
  username: [{ required: true, message: "请输入用户名", trigger: "blur" }],
  phone: [
    { required: true, message: "请输入手机号码", trigger: "blur" }
  ],
  gender: [{ required: true, message: "请选择性别", trigger: "change" }],
  password: [{ required: true, message: "请输入密码", trigger: "blur" }],
  avatar: [{ required: true, message: "请上传头像", trigger: "blur" }]
};

// 打开编辑对话框
function openEditDialog() {
  Object.assign(editUserInfo, userInfo);
  isDialogVisible.value = true;
}

// 提交编辑表单
function submitForm() {
  userFormRef.value.validate(valid => {
    if (valid) {
      Object.assign(userInfo, editUserInfo);
      ElMessage.success("个人信息更新成功！");
      isDialogVisible.value = false;
    }
  });
}

// 上传头像成功后的处理
function handleAvatarSuccess(response) {
  editUserInfo.avatar = response.url; // 假设服务器返回字段为url
  ElMessage.success("头像上传成功！");
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

.info-container {
  margin: 20px 0;
}
</style>
