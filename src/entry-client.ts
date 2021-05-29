import createApp from './main';

// import './registerServiceWorker';
// import router from './router';
// import store from './store';

const { app, router } = createApp();

// app
//   .use(store)
//   .use(router)
//   .mount('#app');

router.isReady().then(() => {
  app.mount('#app');
});

console.log(`${app} was mounted`);
