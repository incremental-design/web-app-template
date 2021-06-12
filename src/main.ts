// import { createApp } from 'vue';
// import devtools from '@vue/devtools';
import createStore from './store';
import { createSSRApp } from 'vue'; // this HAS to be imported after vue devtools

import App from './App.vue';
// import './registerServiceWorker';
import createRouter from './router';

// eslint-disable-next-line
export default function(...args: any) {
  const app = createSSRApp(App);
  const router = createRouter();
  const store = createStore();
  app.use(router).use(store);
  // return { app, router, store, devtools };
  return { app, router, store };
}
