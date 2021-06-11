import createApp from './main';

export default function() {
  const { app, router, store } = createApp();
  return { app, router, store };
}
