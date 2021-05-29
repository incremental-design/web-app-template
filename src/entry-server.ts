import createApp from './main';

export default function() {
  const { app, router, store } = createApp();
  console.log('the app was created');
  return { app, router, store };
}
