<template>
  <main class="login-page">
    <section class="login-hero">
      <div class="login-brand">
        <span class="brand-mark">侨</span>
        <div>
          <h1>侨批图像标注系统</h1>
          <p>面向侨批 OCR、列级校注与结构化复核的业务工作台</p>
        </div>
      </div>
    </section>

    <section class="login-panel">
      <el-card class="login-card" shadow="never">
        <template #header>
          <div class="card-header">
            <h2>{{ currentForm === "login" ? "登录" : "注册账号" }}</h2>
            <el-button link type="primary" @click="toggleForm">
              {{ currentForm === "login" ? "注册" : "返回登录" }}
            </el-button>
          </div>
        </template>

        <el-form
          ref="formRef"
          :model="form"
          :rules="rules"
          label-position="top"
          size="large"
          @keyup.enter="submit"
        >
          <el-form-item label="账号" prop="username">
            <el-input v-model="form.username" clearable placeholder="请输入账号" />
          </el-form-item>

          <el-form-item label="密码" prop="password">
            <el-input
              v-model="form.password"
              clearable
              show-password
              placeholder="请输入密码"
              type="password"
            />
          </el-form-item>

          <el-form-item
            v-if="currentForm === 'register'"
            label="确认密码"
            prop="confirmPassword"
          >
            <el-input
              v-model="form.confirmPassword"
              clearable
              show-password
              placeholder="请再次输入密码"
              type="password"
            />
          </el-form-item>

          <el-button class="submit-btn" type="primary" :loading="loading" @click="submit">
            {{ currentForm === "login" ? "登录系统" : "创建账号" }}
          </el-button>
        </el-form>
      </el-card>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import type { FormInstance, FormRules } from "element-plus";
import { ElMessage } from "element-plus";
import { register } from "@/api/user";
import { useUserStoreHook } from "@/store/modules/user";

defineOptions({ name: "Login" });

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();
const loading = ref(false);
const formRef = ref<FormInstance>();
const currentForm = ref<"login" | "register">("login");

const form = reactive({
  username: "",
  password: "",
  confirmPassword: ""
});

const rules = computed<FormRules>(() => ({
  username: [{ required: true, message: "请输入账号", trigger: "blur" }],
  password: [
    { required: true, message: "请输入密码", trigger: "blur" },
    { min: 6, max: 32, message: "密码长度应为 6-32 位", trigger: "blur" }
  ],
  confirmPassword:
    currentForm.value === "register"
      ? [
          { required: true, message: "请确认密码", trigger: "blur" },
          {
            validator: (_rule, value, callback) => {
              if (value !== form.password) callback(new Error("两次输入的密码不一致"));
              else callback();
            },
            trigger: "blur"
          }
        ]
      : []
}));

function toggleForm() {
  currentForm.value = currentForm.value === "login" ? "register" : "login";
  form.confirmPassword = "";
  formRef.value?.clearValidate();
}

async function submit() {
  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) return;

  loading.value = true;
  try {
    if (currentForm.value === "login") {
      const res = await userStore.loginByUsername({
        username: form.username,
        password: form.password
      });
      if (res.code !== 200) {
        ElMessage.error(res.msg || "登录失败");
        return;
      }
      ElMessage.success("登录成功");
      const redirect = typeof route.query.redirect === "string" ? route.query.redirect : "";
      await router.push(redirect || "/classinfo/index");
      return;
    }

    const res = await register({
      username: form.username,
      password: form.password
    });
    if (res.code === 200) {
      ElMessage.success("注册成功，请登录");
      currentForm.value = "login";
      form.confirmPassword = "";
    } else {
      ElMessage.error(res.msg || "注册失败");
    }
  } catch (error: any) {
    ElMessage.error(error?.message || "请求失败，请检查网络连接");
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 460px;
  background:
    linear-gradient(rgba(23, 32, 51, 0.78), rgba(23, 32, 51, 0.72)),
    url("@/assets/login/bg.png") center / cover no-repeat;
}

.login-hero {
  display: flex;
  align-items: center;
  padding: 72px;
  color: #fff;
}

.login-brand {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  max-width: 620px;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  flex: 0 0 auto;
  border-radius: 10px;
  background: #f59e0b;
  color: #101827;
  font-size: 28px;
  font-weight: 900;
}

h1 {
  margin: 0;
  font-size: 36px;
  line-height: 1.2;
  letter-spacing: 0;
}

p {
  margin: 14px 0 0;
  color: rgba(255, 255, 255, 0.78);
  font-size: 16px;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: rgba(255, 255, 255, 0.94);
}

.login-card {
  width: 100%;
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

h2 {
  margin: 0;
  font-size: 22px;
  color: #172033;
}

.submit-btn {
  width: 100%;
  margin-top: 8px;
}

@media (max-width: 860px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-hero {
    min-height: 260px;
    padding: 40px 24px 20px;
  }

  .login-panel {
    align-items: flex-start;
    padding: 20px;
  }
}
</style>
