const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');
const launchEditorMiddleware = require('launch-editor-middleware');
const { exec } = require('child_process');
const deasync = require('deasync');

function getEditor() {
  const execSync = deasync(exec);
  return execSync('which nova').trim() === '/usr/local/bin/nova' ? 'nova' : 'code';
  // assume that vscode is installed.
}

module.exports = {
  publicPath: '',
  configureWebpack: {
    devServer: {
      headers: { 'Access-Control-Allow-Origin': '*' },
      hot: process.env.NODE_ENV === 'development',
      // injectHot: true,
      stats: 'none',
      before(app) {
        if (process.env.SSR === 'false') {
          app.use('/__open-in-editor', launchEditorMiddleware(getEditor()));
        }
      },
    },
  },
  chainWebpack: (webpackConfig) => {
    webpackConfig.module.rule('vue').uses.delete('cache-loader');
    webpackConfig.module.rule('js').uses.delete('cache-loader');
    webpackConfig.module.rule('ts').uses.delete('cache-loader');
    webpackConfig.module.rule('tsx').uses.delete('cache-loader');

    if (process.env.NODE_ENV === 'development') {
      // !Client and Server configuration for development mode
      // webpackConfig.output.globalObject(`(typeof self !== 'undefined' ? self: this)`); // see line 64 of node_modules/@vue/cli-service/lib/commands/serve.js
      webpackConfig.plugin('progress').use('webpack/lib/ProgressPlugin'); // see lines 67-70 of node_modules/@vue/cli-service/lib/commands.serve.js
    }

    if (process.env.SSR === 'false') {
      // !Client configuration
      webpackConfig
        .entry('app')
        .clear()
        .add('./src/entry-client.ts');

      webpackConfig
        .plugin('manifest')
        .use(new WebpackManifestPlugin({ fileName: 'client-manifest.json' }));

      if (process.env.NODE_ENV === 'development') {
        // !Client configuration for development mode
        console.log('client config');
        webpackConfig.devtool('eval-cheap-module-source-map'); // see lines 53-54 of of node_modules/@vue/cli-service/lib/commands/serve.js
        // webpackConfig.plugin('hmr').use(hmr); // see lines 56-58 of node_modules/@vue/cli-service/lib/commands/serve.js
      }
    } else {
      // !Server configuration
      webpackConfig
        .entry('app')
        .clear()
        .add('./src/entry-server.ts');

      webpackConfig.target('node');
      webpackConfig.output.libraryTarget('commonjs2');

      webpackConfig
        .plugin('manifest')
        .use(new WebpackManifestPlugin({ fileName: 'ssr-manifest.json' }));

      webpackConfig.externals(nodeExternals({ allowlist: /\.(css|vue)$/ })); // this might need to be expanded to allow for less, stylus, scss, sass files

      webpackConfig.optimization.splitChunks(false).minimize(false);
      // do we need to disable hot module replacement? see: https://youtu.be/XJfaAkvLXyU?t=400
      webpackConfig.plugins.delete('preload');
      webpackConfig.plugins.delete('prefetch');
      webpackConfig.plugins.delete('progress');
      webpackConfig.plugins.delete('friendly-errors');

      webpackConfig
        .plugin('limit')
        .use(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));

      if (process.env.NODE_ENV === 'development') {
        // !Server configuration for development mode
        console.log('add in watch mode');
      }
    }
  },
};

/**
 * How to set up SSR in WDS, according to https://github.com/Akryum/vue-cli-plugin-ssr
 *
 * 1. `index.js` https://github.com/Akryum/vue-cli-plugin-ssr/blob/e9d0c4fc448e11805edde294d2cb9654c1daa3ce/index.js
 *
 * choose the host and port you want WDS to use (lines 80-87)
 * pass the host and port into `createServer` (lines 91-94), which is defined in `server.js`. Return the result.
 *
 * 2. `server.js` https://github.com/Akryum/vue-cli-plugin-ssr/blob/e9d0c4fc448e11805edde294d2cb9654c1daa3ce/lib/server.js
 *
 * launch an express server (line 35)
 * pass the express server into `applyApp` (line 37), which is defined in `app.js`. Wait for `applyApp` to finish executing. Then, make the express server listen on the host and port you passed into `createServer` (lines 39-49)
 *
 *
 * 3. `app.js` https://github.com/Akryum/vue-cli-plugin-ssr/blob/e9d0c4fc448e11805edde294d2cb9654c1daa3ce/lib/app.js
 *
 * pass the express server, a path to the template into which the vue bundle renderer should inject the server-side rendered code into, and a callback that you want to run every time you update your `src` directory into `setupDevServer` (lines 71-83), which is defined in `dev-server.js`.
 * Tell the express server to serve all of the static files in your app (lines 85 - 110)
 * wrap the call to `setupDevServer` in a function that calls it, waits for it to execute, and then renders the bundled vue app to string, using vue server renderer. Then, tell express to pass every route request it receives into this function.
 * 4. `dev-server.js` https://github.com/Akryum/vue-cli-plugin-ssr/blob/e9d0c4fc448e11805edde294d2cb9654c1daa3ce/lib/dev-server.js
 *
 * Pass an instance of the Vue CLI Service to `getWebpackConfigs` (line 23), and receive the webpack configs for client and server, in response.
 *
 * Add hot module replacement to the client config (lines 46-49)
 * stick the modified client config into `webpack()` and receive a webpack compiler for the client. (line 52)
 * Pass the client compiler into the webpack dev middleware constructor (line 53), and receive a devMiddleware object
 * Add the devMiddleware object to the server you passed in, with `server.use(devMiddleware)`
 * Print the output from 'vue-cli-ssr-plugin' to console as soon as client compilation is complete (lines 62-87)
 * Pass the client compiler into the webpack hot middleware constructor (line 95), and receive a hotMiddleware object. Then, add the hotMiddleware object to the server you passed in with `server.use(hotMiddleware)` (line 95)
 *
 * stick the modified server config into `webpack()`, and receive a webpack compiler for the server (line 98)
 * start a new memory file system (line 99)
 * make the webpack server compiler output to the memory file system (line 100)
 * instruct the server compiler to run in watch mode. This causes the compiler to re-bundle the entire app every time a file changes. This is different from hot module replacement. With hot module replacement, only the module that contains the file that changed is rebundled. Finally, register a callback that prints to console each time the app is rebundled.
 *
 *
 * 5. `webpack.js` https://github.com/Akryum/vue-cli-plugin-ssr/blob/e9d0c4fc448e11805edde294d2cb9654c1daa3ce/lib/webpack.js
 *
 * Generate the webpack configs for client and server, and return both.
 *
 */

/**
 *
 * 1. Generate a client webpack config (make sure it has hmr)
 * 2. Generate a server webpack config (make sure it has hmr)
 * 3. Every time you make a change, to
 *
 */
