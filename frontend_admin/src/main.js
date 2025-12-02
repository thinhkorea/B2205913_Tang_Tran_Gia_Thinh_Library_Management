import { createApp } from "vue";
import { createPinia } from "pinia";
import axios from "axios";
import App from "./App.vue";
import "@fortawesome/fontawesome-free/css/all.css";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.config.globalProperties.$axios = axios;

app.mount("#app");
