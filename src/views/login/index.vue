<template>
  <main class="login-page">
    <button class="archive-button theme-toggle login-theme" type="button" @click="toggleTheme">
      {{ themeLabel }}
    </button>

    <section class="login-hero">
      <div class="login-brand">
        <span class="archive-kicker">AI Digital Humanities</span>
        <h1>侨批数字人文档案平台</h1>
        <p>
          面向侨批文献 OCR、列级校注与结构化复核的现代化标注工作台。
        </p>
      </div>
      <div class="archive-notes">
        <span>原文影像</span>
        <span>OCR 对照</span>
        <span>人工校勘</span>
      </div>
    </section>

    <section class="login-panel">
      <el-card class="login-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div>
              <span class="archive-kicker">{{ currentForm === "login" ? "Sign in" : "Register" }}</span>
              <h2>{{ currentForm === "login" ? "进入工作台" : "创建账号" }}</h2>
            </div>
            <el-button link @click="toggleForm">
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
import { useTheme } from "@/utils/theme";

defineOptions({ name: "Login" });

const route = useRoute();
const router = useRouter();
const userStore = useUserStoreHook();
const { themeLabel, toggleTheme } = useTheme();
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
  position: relative;
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(380px, 520px);
  background:
    radial-gradient(circle at 20% 16%, var(--app-accent-soft), transparent 30%),
    var(--app-bg);
}

.login-theme {
  position: fixed;
  top: var(--app-space-6);
  right: var(--app-space-6);
  z-index: 5;
  background: var(--app-surface-subtle);
  backdrop-filter: blur(14px);
}

.login-hero {
  display: flex;
  justify-content: space-between;
  flex-direction: column;
  min-height: 100vh;
  padding: clamp(48px, 8vw, 96px);
}

.login-brand {
  max-width: 680px;
}

.login-brand h1 {
  margin: var(--app-space-4) 0 0;
  color: var(--app-text);
  font-family: var(--app-font-serif);
  font-size: clamp(44px, 7vw, 82px);
  font-weight: 700;
  letter-spacing: 0;
  line-height: 1.04;
}

.login-brand p {
  max-width: 560px;
  margin: var(--app-space-6) 0 0;
  color: var(--app-text-muted);
  font-size: 17px;
  line-height: 1.9;
}

.archive-notes {
  display: flex;
  flex-wrap: wrap;
  gap: var(--app-space-3);
}

.archive-notes span {
  padding: var(--app-space-2) var(--app-space-3);
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface-subtle);
  color: var(--app-text-muted);
  font-size: 13px;
}

.login-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--app-space-8);
  border-left: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-surface), transparent 22%);
  backdrop-filter: blur(18px);
}

.login-card {
  width: 100%;
  border-radius: var(--app-radius-card);
  box-shadow: var(--app-shadow);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--app-space-4);
}

h2 {
  margin: var(--app-space-2) 0 0;
  color: var(--app-text);
  font-family: var(--app-font-serif);
  font-size: 26px;
}

.submit-btn {
  width: 100%;
  margin-top: var(--app-space-2);
}

@media (max-width: 860px) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-hero {
    min-height: 420px;
    padding: 72px var(--app-space-6) var(--app-space-6);
  }

  .login-panel {
    align-items: flex-start;
    padding: var(--app-space-6);
    border-left: 0;
    border-top: 1px solid var(--app-border);
  }
}
</style>
