import './registerServiceWorker';
import createApp from './main';

const { app, router, store } = createApp();

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
if (window.ServerSideStoreState) {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  store.replaceState(window.ServerSideStoreState);
}

router.isReady().then(() => {
  app.mount('#app', true);
});
