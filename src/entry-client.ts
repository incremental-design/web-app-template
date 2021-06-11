import createApp from './main';

// import './registerServiceWorker';
// import router from './router';
// import store from './store';
// const { app, router, store, devtools } = createApp();
const { app, router, store } = createApp();

// app
//   .use(store)
//   .use(router)
//   .mount('#app');

// eslint-disable-next-line
// @ts-ignore
const storeInitialState = window.VUEX_SSR_STATE;

if (storeInitialState) {
  console.log('initial state was replaced');
  store.replaceState(storeInitialState);
}

router.isReady().then(() => {
  const instance = app.mount('#app', true);

  /* eslint-disable */
  // @ts-ignore
  app._container._vnode = instance.$.vnode // see https://github.com/vuejs/vue-devtools/issues/1376#issuecomment-794544045
  /* eslint-enable */
  // devtools.connect();
});

console.log(`${app} was mounted`);
