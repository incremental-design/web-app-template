(async () => {
  const Webpack = require('webpack');
  const WebpackDevServer = require('webpack-dev-server');
  const portscanner = require('portscanner');

  const webpackConfig = './node_modules/@vue/cli-service/webpack.config.js';
  process.env.NODE_ENV = 'development';

  function importConfig() {
    // eslint-disable-next-line
  return require(webpackConfig);
  }

  function clearConfig() {
    // see: https://gist.github.com/joerx/3296d972735adc5b4ec1
    Object.keys(require.cache).forEach((key) => {
      // console.log(key);
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

  // console.log(SSRConfig);
  // console.log('\n\n\n\n');
  // console.log(ClientConfig);

  const compiler = Webpack(ClientConfig);

  const devServerConfig = generateClientConfig().devServer;

  console.log(devServerConfig);

  const server = new WebpackDevServer(compiler, devServerConfig);

  const port = await portscanner.findAPortNotInUse(8080, 9000, '127.0.0.1');

  server.listen(port, '127.0.0.1');
})();
