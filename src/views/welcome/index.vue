<template>
  <section class="welcome-intro">
    <header class="hero">
      <p class="hero__badge">Qiaopi OCR Annotation System</p>
      <h1 class="hero__title">侨批图像标注系统</h1>
      <p class="hero__desc">
        面向侨批文献数字化场景，提供图像上传、OCR 识别、人工校正与结果回流的一站式标注流程。
      </p>
    </header>

    <div class="grid">
      <article class="card">
        <h2>核心流程</h2>
        <ul>
          <li>上传侨批图像并触发 OCR 识别</li>
          <li>可视化展示文字框与识别文本</li>
          <li>人工校正文本并提交标注结果</li>
          <li>回看历史标注详情，持续优化模型</li>
        </ul>
      </article>

      <article class="card">
        <h2>系统价值</h2>
        <ul>
          <li>提升侨批文献数字化效率</li>
          <li>降低 OCR 错误对后续研究的影响</li>
          <li>支持高质量人工复核闭环</li>
          <li>为后续训练数据沉淀提供标准输出</li>
        </ul>
      </article>
    </div>

    <footer class="entry">
      <h3>快速开始</h3>
      <p>
        请从左侧菜单进入 <strong>分类信息</strong>，在项目详情页点击
        <strong>新增标注图片</strong> 开始新一轮标注。
      </p>
    </footer>
  </section>
</template>

<style scoped>
.welcome-intro {
  min-height: calc(100vh - 160px);
  padding: 28px;
  color: #1b2a41;
  background:
    radial-gradient(circle at 8% 10%, rgb(91 141 239 / 18%), transparent 40%),
    radial-gradient(circle at 90% 90%, rgb(57 197 187 / 12%), transparent 42%),
    linear-gradient(145deg, #f8fbff 0%, #f2f7ff 50%, #f7fbff 100%);
  border: 1px solid #e4ecf7;
  border-radius: 16px;
}

.hero {
  margin-bottom: 20px;
}

.hero__badge {
  display: inline-block;
  padding: 4px 10px;
  margin: 0 0 10px;
  font-size: 12px;
  letter-spacing: 0.08em;
  color: #2156a8;
  background: #e9f1ff;
  border-radius: 999px;
}

.hero__title {
  margin: 0;
  font-size: 34px;
  line-height: 1.2;
}

.hero__desc {
  max-width: 760px;
  margin: 14px 0 0;
  font-size: 16px;
  line-height: 1.7;
  color: #2f4668;
}

.grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.card {
  padding: 18px 20px;
  background: rgb(255 255 255 / 80%);
  border: 1px solid #d9e6f7;
  border-radius: 12px;
  backdrop-filter: blur(2px);
}

.card h2 {
  margin: 0 0 10px;
  font-size: 19px;
}

.card ul {
  padding-left: 20px;
  margin: 0;
  color: #304967;
  line-height: 1.8;
}

.entry {
  padding: 16px 20px;
  margin-top: 16px;
  background: #fff;
  border-left: 4px solid #4a79d9;
  border-radius: 10px;
}

.entry h3 {
  margin: 0 0 8px;
  font-size: 18px;
}

.entry p {
  margin: 0;
  color: #324b6b;
  line-height: 1.7;
}

@media (width <= 900px) {
  .welcome-intro {
    padding: 20px;
  }

  .hero__title {
    font-size: 28px;
  }

  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
