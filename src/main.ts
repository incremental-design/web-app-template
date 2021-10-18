import { createSSRApp } from 'vue';
import App from './App.vue';
import makeRouter from './router';
import makeStore from './store';

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export default function () {
  const router = makeRouter();
  const store = makeStore();

  const app = createSSRApp(App).use(store).use(router);

  return { app, router, store };
}
