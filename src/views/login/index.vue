<script setup lang="ts">
import Motion from "./utils/motion";
import { useRouter } from "vue-router";
import { message } from "@/utils/message";
import { loginRules, registerRules } from "./utils/rule";
import { useNav } from "@/layout/hooks/useNav";
import type { FormInstance } from "element-plus";
import { useLayout } from "@/layout/hooks/useLayout";
import { useUserStoreHook } from "@/store/modules/user";
import { register } from "@/api/user";
import { initRouter, getTopMenu } from "@/router/utils";
import { bg, avatar, illustration } from "./utils/static";
import { useRenderIcon } from "@/components/ReIcon/src/hooks";
import { ref, reactive, toRaw, onMounted, onBeforeUnmount, nextTick } from "vue";
import { useDataThemeChange } from "@/layout/hooks/useDataThemeChange";

import dayIcon from "@/assets/svg/day.svg?component";
import darkIcon from "@/assets/svg/dark.svg?component";
import Lock from "@iconify-icons/ri/lock-fill";
import User from "@iconify-icons/ri/user-3-fill";
import Refresh from "@iconify-icons/ri/refresh-line";

defineOptions({
  name: "Login"
});
const router = useRouter();
const loading = ref(false);
const ruleFormRef = ref<FormInstance>();
const registerFormRef = ref<FormInstance>();
/** 当前显示的表单：login | register */
const currentForm = ref<"login" | "register">("login");

const { initStorage } = useLayout();
initStorage();

const { dataTheme, overallStyle, dataThemeChange } = useDataThemeChange();
dataThemeChange(overallStyle.value);
const { title } = useNav();

const ruleForm = reactive({
  username: "",
  password: ""
});

const registerForm = reactive({
  username: "",
  password: "",
  confirmPassword: "",
  captcha: ""
});

// ---- 图形验证码 ----
const captchaCanvas = ref<HTMLCanvasElement | null>(null);
const captchaCode = ref("");

function generateCaptchaCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTWXYZabcdefhijkmnprstwxyz2345678";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function drawCaptcha() {
  const canvas = captchaCanvas.value;
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const code = generateCaptchaCode();
  captchaCode.value = code;

  canvas.width = 110;
  canvas.height = 38;

  // 背景
  ctx.fillStyle = "#f0f4ff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 干扰线
  for (let i = 0; i < 4; i++) {
    ctx.strokeStyle = `hsl(${Math.random() * 360}, 50%, 70%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
    ctx.stroke();
  }

  // 字符
  for (let i = 0; i < code.length; i++) {
    ctx.font = `bold ${20 + Math.random() * 6}px Arial`;
    ctx.fillStyle = `hsl(${Math.random() * 360}, 60%, 30%)`;
    ctx.save();
    ctx.translate(12 + i * 26, 28);
    ctx.rotate((Math.random() - 0.5) * 0.5);
    ctx.fillText(code[i], 0, 0);
    ctx.restore();
  }

  // 干扰点
  for (let i = 0; i < 30; i++) {
    ctx.fillStyle = `hsl(${Math.random() * 360}, 50%, 50%)`;
    ctx.beginPath();
    ctx.arc(
      Math.random() * canvas.width,
      Math.random() * canvas.height,
      1.2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

// ---- end 图形验证码 ----

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          if (res.code === 200) {
            // 获取后端路由
            return initRouter().then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message("登录成功", { type: "success" });
              });
            });
          } else {
            message(res.msg || "登录失败", { type: "error" });
          }
        })
        .catch(error => {
          message(error.message || "登录失败,请检查网络连接", { type: "error" });
        })
        .finally(() => (loading.value = false));
    }
  });
};

const onRegister = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate(valid => {
    if (valid) {
      loading.value = true;
      register({
        username: registerForm.username,
        password: registerForm.password
      })
        .then(res => {
          if (res.code === 200) {
            message("注册成功，请登录", { type: "success" });
            // 自动填入用户名，方便直接登录
            ruleForm.username = registerForm.username;
            currentForm.value = "login";
          } else {
            message(res.msg || "注册失败", { type: "error" });
            drawCaptcha();
            registerForm.captcha = "";
          }
        })
        .catch(error => {
          message(error.message || "注册失败，请检查网络连接", { type: "error" });
          drawCaptcha();
          registerForm.captcha = "";
        })
        .finally(() => (loading.value = false));
    }
  });
};

function switchToRegister() {
  currentForm.value = "register";
  nextTick(() => drawCaptcha());
}

function switchToLogin() {
  currentForm.value = "login";
}

/** 使用公共函数，避免`removeEventListener`失效 */
function onkeypress({ code }: KeyboardEvent) {
  if (["Enter", "NumpadEnter"].includes(code)) {
    if (currentForm.value === "login") {
      onLogin(ruleFormRef.value);
    } else {
      onRegister(registerFormRef.value);
    }
  }
}

onMounted(() => {
  window.document.addEventListener("keypress", onkeypress);
});

onBeforeUnmount(() => {
  window.document.removeEventListener("keypress", onkeypress);
});
</script>

<template>
  <div class="select-none">
    <img :src="bg" class="wave" />
    <div class="flex-c absolute right-5 top-3">
      <!-- 主题 -->
      <el-switch
        v-model="dataTheme"
        inline-prompt
        :active-icon="dayIcon"
        :inactive-icon="darkIcon"
        @change="dataThemeChange"
      />
    </div>
    <div class="login-container">
      <div class="img">
        <component :is="toRaw(illustration)" />
      </div>
      <div class="login-box">
        <div class="login-form">
          <avatar class="avatar" />
          <Motion>
            <h2 class="outline-none">{{ title }}</h2>
          </Motion>

          <!-- 登录表单 -->
          <el-form
            v-if="currentForm === 'login'"
            ref="ruleFormRef"
            :model="ruleForm"
            :rules="loginRules"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item
                :rules="[
                  {
                    required: true,
                    message: '请输入账号',
                    trigger: 'blur'
                  }
                ]"
                prop="username"
              >
                <el-input
                  v-model="ruleForm.username"
                  clearable
                  placeholder="账号"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="ruleForm.password"
                  clearable
                  show-password
                  placeholder="密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-button
                class="w-full mt-4"
                size="default"
                type="primary"
                :loading="loading"
                @click="onLogin(ruleFormRef)"
              >
                登录
              </el-button>
            </Motion>

            <Motion :delay="300">
              <div class="flex justify-center mt-4">
                <el-link type="primary" :underline="false" @click="switchToRegister">
                  还没有账号？立即注册
                </el-link>
              </div>
            </Motion>
          </el-form>

          <!-- 注册表单 -->
          <el-form
            v-else
            ref="registerFormRef"
            :model="registerForm"
            :rules="registerRules(captchaCode, registerForm)"
            size="large"
          >
            <Motion :delay="100">
              <el-form-item prop="username">
                <el-input
                  v-model="registerForm.username"
                  clearable
                  placeholder="用户名"
                  :prefix-icon="useRenderIcon(User)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="150">
              <el-form-item prop="password">
                <el-input
                  v-model="registerForm.password"
                  clearable
                  show-password
                  placeholder="密码（8-18位数字、字母、符号任意两种组合）"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="200">
              <el-form-item prop="confirmPassword">
                <el-input
                  v-model="registerForm.confirmPassword"
                  clearable
                  show-password
                  placeholder="确认密码"
                  :prefix-icon="useRenderIcon(Lock)"
                />
              </el-form-item>
            </Motion>

            <Motion :delay="250">
              <el-form-item prop="captcha">
                <div class="captcha-row">
                  <el-input
                    v-model="registerForm.captcha"
                    clearable
                    placeholder="请输入验证码"
                    class="captcha-input"
                  />
                  <canvas
                    ref="captchaCanvas"
                    class="captcha-canvas"
                    title="点击刷新验证码"
                    @click="drawCaptcha"
                  />
                  <el-button
                    link
                    type="primary"
                    :icon="useRenderIcon(Refresh)"
                    @click="drawCaptcha"
                  />
                </div>
              </el-form-item>
            </Motion>

            <Motion :delay="300">
              <el-button
                class="w-full mt-2"
                size="default"
                type="primary"
                :loading="loading"
                @click="onRegister(registerFormRef)"
              >
                注册
              </el-button>
            </Motion>

            <Motion :delay="350">
              <div class="flex justify-center mt-4">
                <el-link type="primary" :underline="false" @click="switchToLogin">
                  已有账号？返回登录
                </el-link>
              </div>
            </Motion>
          </el-form>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url("@/style/login.css");
</style>

<style lang="scss" scoped>
:deep(.el-input-group__append, .el-input-group__prepend) {
  padding: 0;
}

.captcha-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 8px;

  .captcha-input {
    flex: 1;
  }

  .captcha-canvas {
    height: 38px;
    border-radius: 4px;
    cursor: pointer;
    flex-shrink: 0;
    border: 1px solid var(--el-border-color);
  }
}
</style>
