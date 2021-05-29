import createApp from './main';

export default function() {
  const { app, router } = createApp();
  console.log('the app was created');
  return { app, router };
}
