/* eslint-disable @typescript-eslint/no-var-requires */
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const NodeExternals = require('webpack-node-externals');
const Webpack = require('webpack');

module.exports = {
  chainWebpack: (WebpackConfig) => {
    if (process.env.SSR === 'false') {
      WebpackConfig.entry('app').clear().add('./src/entry-client.ts');

      WebpackConfig.plugin('manifest').use(
        new WebpackManifestPlugin({ fileName: 'client-manifest.json' })
      );
    }

    if (process.env.SSR === 'true') {
      WebpackConfig.entry('app').clear().add('./src/entry-server.ts');

      WebpackConfig.plugin('manifest').use(
        new WebpackManifestPlugin({ fileName: 'ssr-manifest.json' })
      );

      WebpackConfig.target('node');
      WebpackConfig.output.libraryTarget('commonjs2');

      WebpackConfig.externals(NodeExternals({ allowlist: /\.(css|scss|less|stylus|vue)$/ }));
      WebpackConfig.optimization.splitChunks(false).minimize(false);
      WebpackConfig.plugin('limit').use(
        new Webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })
      );

      WebpackConfig.plugins.delete('preload');
      WebpackConfig.plugins.delete('prefetch');
    }

    WebpackConfig.module.rule('vue').uses.delete('cache-loader');
    WebpackConfig.module.rule('js').uses.delete('cache-loader');
    WebpackConfig.module.rule('ts').uses.delete('cache-loader');
    WebpackConfig.module.rule('tsx').uses.delete('cache-loader');
  },
  publicPath: '',
};
