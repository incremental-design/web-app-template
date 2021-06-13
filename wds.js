process.env.NODE_ENV = 'development';
process.env.SSR = 'false'; // surprisingly, we are going to use the client webpack config, because we are going to implement SSR with webpack-dev-middleware itself, rather than with an entirely separate server.

const Webpack = require('webpack');
const WebpackDevMiddleware = require('webpack-dev-middleware');
const WebpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const { patchRequire } = require('fs-monkey');

const ClientCompiler = (() => {
  // this will only work if if `process.env.NODE_ENV = 'development'` and `process.env.SSR = 'false'`
  // eslint-disable-next-line
  const ClientConfig = require('./node_modules/@vue/cli-service/webpack.config.js');
  return Webpack(ClientConfig);
})();

const express = require('express');

const server = express();

const { JSDOM } = require('jsdom');

server.use(
  WebpackDevMiddleware(ClientCompiler, {
    serverSideRender: true,
  })
);
server.use((request, response) => {
  // see: https://github.com/webpack/webpack-dev-middleware#server-side-rendering
  const { devMiddleware } = response.locals.webpack;
  const { outputFileSystem } = devMiddleware;
  const jsonWebpackStats = devMiddleware.stats.toJson();
  const { assetsByChunkName, outputPath } = jsonWebpackStats;

  const indexHTML = outputFileSystem.readFileSync(
    path.join(__dirname, 'dist', 'index.html'),
    'utf8'
  );

  // run the server bundle, stick the results into indexHTML, then send it!
});
server.use(WebpackHotMiddleware(ClientCompiler));

server.listen(8080);
