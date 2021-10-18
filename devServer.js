/* eslint-disable global-require */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
/* eslint-disable import/no-dynamic-require */
process.env.NODE_ENV = 'development';
const path = require('path');
const Webpack = require('webpack');
const express = require('express');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
const requireFromString = require('require-from-string');
const { renderToString } = require('@vue/server-renderer');
const serialize = require('serialize-javascript');

function startDevServer(port) {
  // Grab the browser half of Vue CLI's webpack config, and hand it to Webpack
  process.env.SSR = 'false';
  const WebpackConfigPath = './node_modules/@vue/cli-service/webpack.config.js';
  const ClientWebpack = Webpack(require(WebpackConfigPath));
  delete require.cache[require.resolve(WebpackConfigPath)];

  // Grab the server half of Vue CLI's webpack config, and hand it to Webpack
  process.env.SSR = 'true';
  const ServerWebpack = Webpack(require(WebpackConfigPath));
  delete require.cache[require.resolve(WebpackConfigPath)];
  // delete process.env.SSR;

  // make an express server, and hand it over to webpack dev server, with webpack-dev-middleware
  const Server = express();
  Server.use(
    WebpackDevMiddleware(ClientWebpack, {
      serverSideRender: true,
      stats: false,
    })
  );

  // tell webpack dev server to use hot module reloading
  Server.use(WebpackHotMiddleware(ClientWebpack));

  // tell webpack dev server what to serve
  Server.use(async (request, response) => {
    // grab the index.html file out of the client build
    const { devMiddleware } = response.locals.webpack;
    const { outputFileSystem } = devMiddleware;
    const IndexHTML = outputFileSystem.readFileSync(
      path.join(__dirname, 'dist', 'index.html'),
      'utf8'
    );

    // make server bundle
    ServerWebpack.outputFileSystem = outputFileSystem;
    ServerWebpack.outputPath = path.join(__dirname, 'dist', 'server');
    const MakeServerBundle = async () => {
      return new Promise((resolve, reject) => {
        ServerWebpack.run((err, stats) => {
          if (err) {
            reject(err);
          } else {
            resolve(stats);
          }
        });
      });
    };
    await MakeServerBundle();

    // grab the ssr-manifest file out of the server bundle
    const SSRManifestPath = path.join(ServerWebpack.outputPath, 'ssr-manifest.json');
    const SSRManifest = JSON.parse(outputFileSystem.readFileSync(SSRManifestPath));

    // grab the server bundle entrypoint (app.js) out of the server bundle
    const AppPath = path.join(ServerWebpack.outputPath, SSRManifest['app.js']);
    const createAppString = outputFileSystem.readFileSync(AppPath, 'utf8');
    const createApp = requireFromString(createAppString).default;

    // create the server app
    const { app, router, store } = createApp();

    // load the requested route
    router.push(request.url);
    await router.isReady();

    const RenderedApp = await renderToString(app);
    const RenderedState = `<script>window.ServerSideStoreState=${serialize(store.state)}</script>`;

    // splice rendered app and rendred state into the index.html and send it
    response.send(
      IndexHTML.replace(
        '<div id="app"></div>',
        `${RenderedState}<div id="app">${RenderedApp}</div>`
      )
    );
  });

  // make the server listen on port
  return Server.listen(port);
  // return server;
}

module.exports = startDevServer;

startDevServer(8080);
