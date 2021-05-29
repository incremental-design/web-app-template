// import { createApp } from 'vue';
import { createSSRApp } from 'vue';
import App from './App.vue';
// import './registerServiceWorker';
import createRouter from './router';
import createStore from './store';

// createApp(App)
//   .use(store)
//   .use(router)
//   .mount('#app');

export default function(...args: any) {
  const app = createSSRApp(App);
  const router = createRouter();
  const store = createStore();
  app.use(router).use(store);
  return { app, router, store };
}
