process.env.NODE_ENV = 'development';
process.env.SSR = 'false'; // surprisingly, we are going to use the client webpack config, because we are going to implement SSR with webpack-dev-middleware itself, rather than with an entirely separate server.

const Webpack = require('webpack');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const requireFromString = require('require-from-string');
const { renderToString } = require('@vue/server-renderer');
const serialize = require('serialize-javascript');
// const { patchRequire } = require('fs-monkey');
// const deasync = require('deasync');

const pathToWebpackConfig = './node_modules/@vue/cli-service/webpack.config.js';

const ClientCompiler = (() => {
  // this will only work if if `process.env.NODE_ENV = 'development'` and `process.env.SSR = 'false'`
  const ClientConfig = require(pathToWebpackConfig); // eslint-disable-line
  return Webpack(ClientConfig);
})();

function deleteKeyFromRequireCache(keyToDelete) {
  Object.keys(require.cache).forEach((key) => {
    if (key.toString().includes(keyToDelete)) {
      delete require.cache[key];
    }
  });
}

const ServerConfig = (() => {
  process.env.SSR = 'true';
  deleteKeyFromRequireCache(pathToWebpackConfig.slice(1));
  const ServerConfig = require(pathToWebpackConfig); //eslint-disable-line

  // set things back to the way they were
  process.env.SSR = 'false';
  deleteKeyFromRequireCache(pathToWebpackConfig.slice(1));

  return ServerConfig;
})();

const generateServerSideApp = async (MemoryFilesystem, requestURL) => {
  const ServerCompiler = Webpack(ServerConfig);
  // const MemoryFilesystem = createFsFromVolume(new Volume());
  // MemoryFilesystem.join = path.join.bind(path); // see https://webpack.js.org/contribute/writing-a-loader/#testing
  ServerCompiler.outputFileSystem = MemoryFilesystem;
  ServerCompiler.outputPath = path.join(__dirname, 'dist', 'server');

  const compileServer = async () => {
    return new Promise((resolve, reject) => {
      ServerCompiler.run((error, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats);
        }
      });
    });
  };

  await compileServer();

  const SSRManifest = JSON.parse(
    MemoryFilesystem.readFileSync(path.join(ServerCompiler.outputPath, 'ssr-manifest.json'))
  );

  const AppJS = MemoryFilesystem.readFileSync(
    path.join(ServerCompiler.outputPath, SSRManifest['app.js']),
    'utf8'
  );

  const { app, router, store } = requireFromString(AppJS).default();

  router.push(requestURL);
  await router.isReady();

  const appContent = await renderToString(app);
  const renderState = `<script>window.VUEX_SSR_STATE = ${serialize(store.state)}</script>`;
  // consider putting render state into a VUE_APP_* environment variable, and then interpolating that variable in your public/index.html. See: https://cli.vuejs.org/guide/html-and-static-assets.html#interpolation
  return { appContent, renderState };
};

const express = require('express');

const server = express();

server.use(
  WebpackDevMiddleware(ClientCompiler, {
    serverSideRender: true,
    stats: false,
  })
);
server.use(WebpackHotMiddleware(ClientCompiler));
server.use(async (request, response) => {
  // see: https://github.com/webpack/webpack-dev-middleware#server-side-rendering
  const { devMiddleware } = response.locals.webpack;
  const { outputFileSystem } = devMiddleware;
  // const jsonWebpackStats = devMiddleware.stats.toJson();
  // const { assetsByChunkName, outputPath } = jsonWebpackStats;

  let indexHTML = outputFileSystem.readFileSync(path.join(__dirname, 'dist', 'index.html'), 'utf8');

  // run the server bundle, stick the results into indexHTML, then send it!
  const { appContent, renderState } = await generateServerSideApp(outputFileSystem, request.url);
  indexHTML = indexHTML.replace('<div id="app">', `${renderState}<div id="app">${appContent}`);
  console.log(indexHTML);
  response.send(indexHTML);
});

server.listen(8080);
