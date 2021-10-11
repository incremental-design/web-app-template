/* eslint-disable import/no-extraneous-dependencies */
import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import portscanner from 'portscanner';
import webpackConfig from './node_modules/@vue/cli-service/webpack.config';

const compiler = webpack(webpackConfig);
const devServerConfig = webpackConfig.devServer;
const server = new WebpackDevServer(compiler, devServerConfig);

module.exports = async () => {
  const port = await portscanner.findAPortNotInUse(8080, 9000, '127.0.0.1');
  server.listen(port, '127.0.0.1');
  // eslint-disable-next-line no-underscore-dangle
  global.__WEBPACK_DEVELOPMENT_SERVER__ = server;
  process.env.WEBPACK_DEVELOPMENT_SERVER_PORT = port;
};
