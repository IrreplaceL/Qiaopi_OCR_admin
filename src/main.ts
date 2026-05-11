import App from "./App.vue";
import router from "./router";
import { setupStore } from "@/store";
import { createApp } from "vue";
import ElementPlus from "element-plus";
import zhCn from "element-plus/es/locale/lang/zh-cn";
import "./style/reset.scss";
import "./style/index.scss";
import "element-plus/dist/index.css";

const app = createApp(App);

setupStore(app);
app.use(router);
app.use(ElementPlus, { locale: zhCn });
app.mount("#app");
