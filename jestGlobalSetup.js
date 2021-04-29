const Webpack = require('webpack');
const webpackConfig = require('./node_modules/@vue/cli-service/webpack.config.js');

const compiler = Webpack(webpackConfig);
const devServerConfig = webpackConfig.devServer;

const WebpackDevServer = require('webpack-dev-server');

const server = new WebpackDevServer(compiler, devServerConfig);

const portscanner = require('portscanner');

module.exports = async () => {
  const port = await portscanner.findAPortNotInUse(8080, 9000, '127.0.0.1');
  server.listen(port, '127.0.0.1');
  global.WEBPACK_DEVELOPMENT_SERVER = server;
  process.env.WEBPACK_DEVELOPMENT_SERVER_PORT = port;
};
