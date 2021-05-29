const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const nodeExternals = require('webpack-node-externals');
const webpack = require('webpack');

module.exports = {
  publicPath: '',
  chainWebpack: (webpackConfig) => {
    webpackConfig.module.rule('vue').uses.delete('cache-loader');
    webpackConfig.module.rule('js').uses.delete('cache-loader');
    webpackConfig.module.rule('ts').uses.delete('cache-loader');
    webpackConfig.module.rule('tsx').uses.delete('cache-loader');

    if (!process.env.SSR) {
      webpackConfig
        .entry('app')
        .clear()
        .add('./src/entry-client.ts');
      return;

      // need to make clientManifest ... see: https://v3.vuejs.org/guide/ssr/build-config.html#generating-clientmanifest
    }

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

    webpackConfig.plugin('limit').use(new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 }));
  },
};
