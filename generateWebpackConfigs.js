const Webpack = require('webpack');
// const WebpackDevServer = require('webpack-dev-server');
// const portscanner = require('portscanner');
const { createFsFromVolume, Volume } = require('memfs');
const { patchRequire } = require('fs-monkey');
const { ufs } = require('unionfs');
const fs = require('fs');
const path = require('path');
const serialize = require('serialize-javascript');
const express = require('express');
const { renderToString } = require('@vue/server-renderer');
const launchEditorMiddleware = require('launch-editor-middleware');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');

const { exec } = require('child_process');
const deasync = require('deasync');

process.env.NODE_ENV = 'development';

function getEditor() {
  const execSync = deasync(exec);
  return execSync('which nova').trim() === '/usr/local/bin/nova' ? 'nova' : 'code';
  // assume that vscode is installed.
}

function getWebpackConfigs() {
  const webpackConfigPath = './node_modules/@vue/cli-service/webpack.config.js';

  const clearConfig = () => {
    Object.keys(require.cache).forEach((key) => {
      if (key.toString().includes(webpackConfigPath.slice(1))) {
        delete require.cache[key];
      }
    });
  };

  process.env.SSR = 'false'; // this has to be a string or node will complain
  const ClientConfig = require(webpackConfigPath); // eslint-disable-line
  clearConfig();
  process.env.SSR = 'true'; // this has to be a string or node will complain
  const ServerConfig = require(webpackConfigPath) // eslint-disable-line
  delete process.env.SSR;

  return { ClientConfig, ServerConfig };
}

async function setupCompilers(ClientConfig, ServerConfig) {
  const ClientCompiler = Webpack(ClientConfig);
  const ServerCompiler = Webpack(ServerConfig);
  const MemoryFilesystem = createFsFromVolume(new Volume());

  MemoryFilesystem.join = path.join.bind(path); // see https://webpack.js.org/contribute/writing-a-loader/#testing

  ClientCompiler.outputFileSystem = MemoryFilesystem;
  ClientCompiler.outputPath = path.join(__dirname, 'dist', 'client');

  ServerCompiler.outputFileSystem = MemoryFilesystem;
  ServerCompiler.outputPath = path.join(__dirname, 'dist', 'server');

  return { ClientCompiler, ServerCompiler, MemoryFilesystem };
}

async function runCompiler(Compiler) {
  return new Promise((resolve, reject) => {
    Compiler.run((error, stats) => {
      if (error) {
        reject(error);
      } else {
        resolve(stats);
      }
    });
  });
}

async function setupServer() {
  const { ClientConfig, ServerConfig } = getWebpackConfigs();
  const { ClientCompiler, ServerCompiler, MemoryFilesystem } = await setupCompilers(
    ClientConfig,
    ServerConfig
  );

  await runCompiler(ClientCompiler);
  await runCompiler(ServerCompiler);

  ufs.use(MemoryFilesystem).use(fs);
  patchRequire(ufs); // see: https://github.com/streamich/fs-monkey/blob/master/docs/api/patchRequire.md

  // eslint-disable-next-line
  const manifest = require(path.join(__dirname, 'dist', 'server', 'ssr-manifest.json'));

  const server = express();

  const appPath = path.join(__dirname, 'dist', 'server', manifest['app.js']);

  // eslint-disable-next-line
  const createApp = require(appPath).default;

  const serveStaticFromMemoryFilesystem = (request, response, next) => {
    // switch(request.toString().split('/')){
    // }
    // console.log(`the request was ${request.path.split('/')[1]} \n\n`);
    switch (request.path.split('/')[1]) {
      case 'js':
      case 'css':
        response.send(
          MemoryFilesystem.readFileSync(path.join(__dirname, 'dist', 'client', request.path))
        );
        break;
      case 'img':
      case 'favicon.ico':
        response.send(
          Buffer.from(
            MemoryFilesystem.readFileSync(path.join(__dirname, 'dist', 'client', request.path))
          )
        );
        break;
      default:
        next();
    }
  };

  server.use('/__open-in-editor', launchEditorMiddleware(getEditor()));

  console.log(ClientConfig.output.publicPath);

  server.use(serveStaticFromMemoryFilesystem);

  server.use(
    webpackDevMiddleware(ClientCompiler, {
      // mimeTypes: { html: 'text/html', js: 'application/javascript' },
      publicPath: ClientConfig.output.publicPath,
      stats: false,
      index: false,
    })
  ); // see: https://www.npmjs.com/package/webpack-hot-middleware
  server.use(webpackHotMiddleware(ClientCompiler));
  server.get('*', async (request, response) => {
    const { app, router, store } = await createApp();

    router.push(request.url);
    await router.isReady();

    const appContent = await renderToString(app);
    const renderState = `<script>window.VUEX_SSR_STATE = ${serialize(store.state)}</script>`;
    // consider putting render state into a VUE_APP_* environment variable, and then interpolating that variable in your public/index.html. See: https://cli.vuejs.org/guide/html-and-static-assets.html#interpolation

    MemoryFilesystem.readFile(path.join(__dirname, '/dist/client/index.html'), (error, html) => {
      if (error) {
        throw error;
      }
      const htmlResponse = html
        .toString()
        .replace('<div id="app">', `${renderState}<div id="app">${appContent}`);
      response.setHeader('Content-Type', 'text/html');
      response.send(htmlResponse);
    });
  });

  server.listen(8080);
}

setupServer();
