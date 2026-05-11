<template>
  <div class="app-shell">
    <header class="app-header">
      <button class="brand" type="button" @click="goHome">
        <span class="brand-mark">侨</span>
        <span>
          <strong>侨批图像标注系统</strong>
          <small>OCR 与人工校注工作台</small>
        </span>
      </button>

      <nav class="app-nav">
        <el-button text :icon="FolderOpened" @click="goHome">项目组</el-button>
        <el-dropdown trigger="click" @command="handleUserCommand">
          <el-button text :icon="User">
            {{ username || "当前用户" }}
            <el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
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
import { ArrowDown, FolderOpened, User } from "@element-plus/icons-vue";
import { useUserStoreHook } from "@/store/modules/user";

const router = useRouter();
const userStore = useUserStoreHook();
const username = computed(() => userStore.nickname || userStore.username);

function goHome() {
  router.push("/classinfo/index");
}

function handleUserCommand(command: string) {
  if (command === "logout") {
    userStore.logOut();
  }
}
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  background: #f5f7fb;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  padding: 0 24px;
  background: #172033;
  color: #fff;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 0;
  color: inherit;
  background: transparent;
  border: 0;
}

.brand-mark {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #f59e0b;
  color: #101827;
  font-weight: 800;
}

.brand strong,
.brand small {
  display: block;
  text-align: left;
}

.brand strong {
  font-size: 18px;
  line-height: 1.2;
}

.brand small {
  margin-top: 2px;
  color: rgba(255, 255, 255, 0.68);
  font-size: 12px;
  font-weight: 400;
}

.app-nav {
  display: flex;
  align-items: center;
  gap: 8px;
}

.app-nav :deep(.el-button) {
  color: #fff;
}

.app-main {
  min-height: calc(100vh - 64px);
  padding: 24px;
}

@media (max-width: 720px) {
  .app-header {
    height: auto;
    min-height: 64px;
    align-items: flex-start;
    flex-direction: column;
    gap: 10px;
    padding: 14px 16px;
  }

  .app-nav {
    width: 100%;
    justify-content: space-between;
  }

  .app-main {
    padding: 14px;
  }
}
</style>
