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

const { exec } = require('child_process');
const deasync = require('deasync');

function getEditor() {
  const execSync = deasync(exec);
  return execSync('which nova').trim() === '/usr/local/bin/nova' ? 'nova' : 'code';
  // assume that vscode is installed.
}

async function setupServer() {
  const webpackConfig = './node_modules/@vue/cli-service/webpack.config.js';
  process.env.NODE_ENV = 'development';

  function importConfig() {
    // eslint-disable-next-line
  return require(webpackConfig);
  }

  function clearConfig() {
    // see: https://gist.github.com/joerx/3296d972735adc5b4ec1
    Object.keys(require.cache).forEach((key) => {
      if (key.toString().includes(webpackConfig.slice(1))) {
        delete require.cache[key];
      }
    });
  }

  function generateSSRConfig() {
    process.env.SSR = 'true';
    return importConfig();
  }

  function generateClientConfig() {
    process.env.SSR = 'false';
    return importConfig();
  }

  const SSRConfig = generateSSRConfig();
  clearConfig();
  const ClientConfig = generateClientConfig();

  const ClientCompiler = Webpack(ClientConfig);
  const SSRCompiler = Webpack(SSRConfig);

  const memoryFilesystem = createFsFromVolume(new Volume());
  memoryFilesystem.join = path.join.bind(path); // see https://webpack.js.org/contribute/writing-a-loader/#testing

  ClientCompiler.outputFileSystem = memoryFilesystem;
  ClientCompiler.outputPath = path.join(__dirname, 'dist', 'client');

  SSRCompiler.outputFileSystem = memoryFilesystem;
  SSRCompiler.outputPath = path.join(__dirname, 'dist', 'server');

  const compileClient = () => {
    return new Promise((resolve, reject) => {
      ClientCompiler.run((error, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats);
        }
      });
    });
  };

  const compileServer = () => {
    return new Promise((resolve, reject) => {
      SSRCompiler.run((error, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats);
        }
      });
    });
  };

  await compileClient();
  await compileServer();

  ufs.use(memoryFilesystem).use(fs);
  patchRequire(ufs); // see: https://github.com/streamich/fs-monkey/blob/master/docs/api/patchRequire.md

  // eslint-ingore-next-line
  const manifest = require(path.join(__dirname, 'dist', 'server', 'ssr-manifest.json'));

  const server = express();

  const appPath = path.join(__dirname, 'dist', 'server', manifest['app.js']);

  const createApp = require(appPath).default;

  server.use('/img', express.static(path.join(__dirname, './dist/client', 'img')));
  server.use('/js', express.static(path.join(__dirname, './dist/client', 'js')));
  server.use('/css', express.static(path.join(__dirname, './dist/client', 'css')));
  server.use('/favicon.ico', express.static(path.join(__dirname, './dist/client', 'favicon.ico')));

  const serveStaticFromMemoryFilesystem = (request, response, next) => {
    // switch(request.toString().split('/')){
    // }
    // console.log(`the request was ${request.path.split('/')[1]} \n\n`);
    switch (request.path.split('/')[1]) {
      case 'js':
      case 'css':
        response.send(
          memoryFilesystem.readFileSync(path.join(__dirname, 'dist', 'client', request.path))
        );
        break;
      case 'img':
      case 'favicon.ico':
        response.send(
          Buffer.from(
            memoryFilesystem.readFileSync(path.join(__dirname, 'dist', 'client', request.path))
          )
        );
        break;
      default:
        next();
    }
  };

  server.use('/__open-in-editor', launchEditorMiddleware(getEditor()));

  server.use(serveStaticFromMemoryFilesystem);

  server.get('*', async (request, response) => {
    const { app, router, store } = await createApp();

    router.push(request.url);
    await router.isReady();

    const appContent = await renderToString(app);
    const renderState = `<script>window.VUEX_SSR_STATE = ${serialize(store.state)}</script>`;
    // consider putting render state into a VUE_APP_* environment variable, and then interpolating that variable in your public/index.html. See: https://cli.vuejs.org/guide/html-and-static-assets.html#interpolation

    memoryFilesystem.readFile(path.join(__dirname, '/dist/client/index.html'), (error, html) => {
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

  // const devServerConfig = generateClientConfig().devServer;

  // const server = new WebpackDevServer(ClientCompiler, devServerConfig);

  // const port = await portscanner.findAPortNotInUse(8080, 9000, '127.0.0.1');

  // server.listen(port, '127.0.0.1');
}

setupServer();
