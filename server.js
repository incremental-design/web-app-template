// we have to use commonjs imports because webpack doesn't handle imports outside of the bundle. the bundle only includes stuff in ./src
const path = require('path');
const serialize = require('serialize-javascript');
const express = require('express');
const fs = require('fs');
const { renderToString } = require('@vue/server-renderer');
const manifest = require('./dist/server/ssr-manifest.json');

const server = express();
const appPath = path.join(__dirname, './dist', 'server', manifest['app.js']);

const createApp = require(appPath).default; // why need `.default`?

server.use('/img', express.static(path.join(__dirname, './dist/client', 'img')));
server.use('/js', express.static(path.join(__dirname, './dist/client', 'js')));
server.use('/css', express.static(path.join(__dirname, './dist/client', 'css')));
server.use('/favicon.ico', express.static(path.join(__dirname, './dist/client', 'favicon.ico')));

server.get('*', async (request, response) => {
  const { app, router, store } = await createApp();

  router.push(request.url);
  await router.isReady();

  const appContent = await renderToString(app);
  const renderState = `
  <script>
    window.INITIAL_DATA = ${serialize(store.state)}
  </script>
  `;
  fs.readFile(path.join(__dirname, '/dist/client/index.html'), (error, html) => {
    if (error) {
      throw error;
    }
    const htmlResponse = html.toString().replace('<div id="app">', `<div id="app">${appContent}`);
    response.setHeader('Content-Type', 'text/html');
    console.log(htmlResponse);
    response.send(htmlResponse);
  });
});

server.listen(8080);
