/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-dynamic-require */
const express = require('express');
const path = require('path');
const fs = require('fs');
const { renderToString } = require('@vue/server-renderer');
const serialize = require('serialize-javascript');

const Manifest = require(path.join(__dirname, './dist/server/ssr-manifest.json'));
const AppPath = path.join(__dirname, './dist/server', Manifest['app.js']);

const ImgPath = path.join(__dirname, './dist/client/img');
const JSPath = path.join(__dirname, './dist/client/js');
const CSSPath = path.join(__dirname, './dist/client/css');
const FaviconPath = path.join(__dirname, './dist/client/favicon.ico');

const server = express();

server.use('/img', express.static(ImgPath));
server.use('/js', express.static(JSPath));
server.use('/css', express.static(CSSPath));
server.use('/favicon.ico', express.static(FaviconPath));

const createApp = require(AppPath).default;

server.get('*', async (request, response) => {
  const { app, router, store } = createApp();

  router.push(request.url);
  await router.isReady();

  const RenderedApp = await renderToString(app);
  const RenderedState = `<script>window.ServerSideStoreState=${serialize(store.state)}</script>`;

  fs.readFile(path.join(__dirname, './dist/client/index.html'), 'utf8', (err, IndexHtmlString) => {
    response.send(
      IndexHtmlString.replace(
        '<div id="app"></div>',
        `${RenderedState}<div id="app">${RenderedApp}</div>`
      )
    );
  });
});

server.listen(80);
