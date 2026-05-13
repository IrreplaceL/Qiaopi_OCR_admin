<template>
  <section class="home-page">
    <section class="home-hero">
      <span class="archive-kicker">Qiaopi Archive</span>
      <h1 class="archive-title">侨批数字人文档案平台</h1>
      <p>
        平台面向侨批文献的数字化整理、OCR 识别、人工校注与结构化复核，
        希望让散落在图像中的家书、汇款凭证和移民记忆，能够被更稳定地保存、检索和研究。
      </p>
      <div class="hero-actions">
        <el-button type="primary" @click="router.push('/classinfo/index')">进入项目组</el-button>
        <el-button @click="router.push('/settings')">查看提示词</el-button>
        <a
          class="github-link"
          href="https://github.com/IrreplaceL/Qiaopi_OCR_admin"
          target="_blank"
          rel="noreferrer"
          aria-label="打开 GitHub 项目仓库"
          title="GitHub 项目仓库"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.19-1.11-1.5-1.11-1.5-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.35 1.12 2.92.86.09-.67.35-1.12.63-1.38-2.22-.26-4.55-1.14-4.55-5.08 0-1.12.39-2.04 1.03-2.76-.1-.26-.45-1.31.1-2.72 0 0 .84-.28 2.75 1.05A9.36 9.36 0 0 1 12 6.93c.85 0 1.7.12 2.5.34 1.9-1.33 2.74-1.05 2.74-1.05.55 1.41.2 2.46.1 2.72.64.72 1.03 1.64 1.03 2.76 0 3.95-2.34 4.81-4.57 5.07.36.32.68.95.68 1.92 0 1.38-.01 2.5-.01 2.84 0 .27.18.59.69.49A10.13 10.13 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
            />
          </svg>
          <span>GitHub</span>
        </a>
      </div>
    </section>

    <section class="home-grid">
      <article class="home-panel">
        <span>01</span>
        <h2>建立初衷</h2>
        <p>
          侨批兼具家书、金融凭证与社会史料属性。平台通过图像与文本并置的标注方式，
          降低整理门槛，让研究者能持续沉淀可靠的文本与元数据。
        </p>
      </article>
      <article class="home-panel">
        <span>02</span>
        <h2>平台意义</h2>
        <p>
          每一次校正都让侨批从难以检索的影像，转化为可分析、可复核、可传承的数据。
          这既服务个案阅读，也支持跨地域、跨时间的数字人文研究。
        </p>
      </article>
      <article class="home-panel">
        <span>03</span>
        <h2>使用流程</h2>
        <p>
          先进入项目组，选择或创建文献集合；上传图像生成 AI 初稿；进入标注详情校正文
          字、坐标和结构化字段；最后按 JSON 或 HTML 导出成果。
        </p>
      </article>
    </section>

    <section class="workflow-band">
      <h2>从影像到档案数据</h2>
      <div class="workflow-steps">
        <span>项目组管理</span>
        <span>OCR 与 AI 标注</span>
        <span>人工校注复核</span>
        <span>结构化导出</span>
      </div>
    </section>
  </section>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";

defineOptions({ name: "Home" });

const router = useRouter();
</script>

<style scoped>
.home-page {
  max-width: 1180px;
  margin: 0 auto;
}

.home-hero {
  min-height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: clamp(36px, 7vw, 88px) 0;
}

.home-hero .archive-title {
  max-width: 760px;
  margin-top: var(--app-space-3);
  font-size: clamp(38px, 7vw, 76px);
}

.home-hero p {
  max-width: 720px;
  margin: var(--app-space-6) 0 0;
  color: var(--app-text-muted);
  font-size: 17px;
  line-height: 2;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--app-space-3);
  margin-top: var(--app-space-8);
}

.github-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 32px;
  padding: 8px 15px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-control);
  color: var(--app-text);
  background: var(--app-surface);
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  text-decoration: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.github-link svg {
  width: 18px;
  height: 18px;
  flex: 0 0 auto;
}

.github-link:hover {
  border-color: var(--app-accent);
  box-shadow: var(--app-shadow-soft);
  transform: translateY(-1px);
}

.home-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--app-space-4);
}

.home-panel {
  min-height: 240px;
  padding: var(--app-space-6);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-card);
  background: var(--app-surface);
  box-shadow: var(--app-shadow-soft);
}

.home-panel span {
  color: var(--app-accent);
  font-family: var(--app-font-mono);
  font-size: 12px;
  font-weight: 800;
}

.home-panel h2,
.workflow-band h2 {
  margin: var(--app-space-3) 0;
  color: var(--app-text);
  font-family: var(--app-font-serif);
}

.home-panel p {
  margin: 0;
  color: var(--app-text-muted);
  line-height: 1.9;
}

.workflow-band {
  margin-top: var(--app-space-8);
  padding: var(--app-space-6);
  border-top: 1px solid var(--app-border);
}

.workflow-steps {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: var(--app-space-3);
}

.workflow-steps span {
  padding: var(--app-space-3) var(--app-space-4);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius-control);
  color: var(--app-text-muted);
  background: var(--app-surface-subtle);
  text-align: center;
}

@media (max-width: 860px) {
  .home-grid,
  .workflow-steps {
    grid-template-columns: 1fr;
  }
}
</style>
