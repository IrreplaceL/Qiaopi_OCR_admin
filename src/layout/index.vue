<template>
  <div class="app-shell">
    <header class="app-header">
      <button class="brand" type="button" @click="goHome">
        <span class="brand-mark">侨</span>
        <span class="brand-copy">
          <strong>侨批数字人文档案平台</strong>
          <small>AI OCR 与人工校注工作台</small>
        </span>
      </button>

      <nav class="app-nav">
        <el-button text :icon="FolderOpened" @click="goHome">项目组</el-button>
        <el-button text class="theme-toggle" @click="toggleTheme">
          {{ themeLabel }}
        </el-button>
        <el-dropdown trigger="click" @command="handleUserCommand">
          <el-button text :icon="User">
            {{ username || "当前用户" }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="settings" :icon="Setting">设置</el-dropdown-item>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { ArrowDown, FolderOpened, Setting, User } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";
import { useTheme } from "@/utils/theme";

const router = useRouter();
const userStore = useUserStoreHook();
const { themeLabel, toggleTheme } = useTheme();
const username = computed(() => userStore.nickname || userStore.username);

function goHome() {
  router.push("/classinfo/index");
}

function handleUserCommand(command: string) {
  if (command === "settings") {
    router.push("/settings");
    return;
  }

  if (command === "logout") {
    userStore.logOut();
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface), transparent 38%), transparent 260px),
    var(--app-bg);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: var(--app-header-height);
  padding: 0 var(--app-space-8);
  border-bottom: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-bg), transparent 12%);
  backdrop-filter: blur(18px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: var(--app-space-3);
  padding: 0;
  color: var(--app-text);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-subtle);
  color: var(--app-accent);
  font-family: var(--app-font-serif);
  font-size: 18px;
  font-weight: 800;
}

.brand-copy strong,
.brand-copy small {
  display: block;
  text-align: left;
}

.brand-copy strong {
  font-family: var(--app-font-serif);
  font-size: 17px;
  line-height: 1.2;
}

.brand-copy small {
  margin-top: 2px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 500;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: var(--app-space-2);
}

.app-nav :deep(.el-button) {
  color: var(--app-text-muted);
}

.app-main {
  min-height: calc(100vh - var(--app-header-height));
  padding: var(--app-space-8);
}

@media (max-width: 720px) {
  .app-header {
    height: auto;
    min-height: var(--app-header-height);
    align-items: flex-start;
    flex-direction: column;
    gap: var(--app-space-3);
    padding: var(--app-space-4);
  }

  .app-nav {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .app-main {
    padding: var(--app-space-4);
  }
}
</style>
