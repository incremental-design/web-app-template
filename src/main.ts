// import { createApp } from 'vue';
import { createSSRApp } from 'vue';
import App from './App.vue';
// import './registerServiceWorker';
import createRouter from './router';
// import store from './store';

// createApp(App)
//   .use(store)
//   .use(router)
//   .mount('#app');

export default function(...args: any) {
  const app = createSSRApp(App);
  const router = createRouter();
  app.use(router);
  return { app, router };
}
