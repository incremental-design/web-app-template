import createApp from './main';

// import './registerServiceWorker';
// import router from './router';
// import store from './store';

const { app, router, store } = createApp();

// app
//   .use(store)
//   .use(router)
//   .mount('#app');

// eslint-disable-next-line
// @ts-ignore
const storeInitialState = window.INITIAL_DATA;

if (storeInitialState) {
  store.replaceState(storeInitialState);
}

router.isReady().then(() => {
  app.mount('#app', true);
});

console.log(`${app} was mounted`);
