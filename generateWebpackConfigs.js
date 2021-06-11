const Webpack = require('webpack');
const WebpackDevServer = require('webpack-dev-server');
const portscanner = require('portscanner');
const { createFsFromVolume, Volume } = require('memfs');

const path = require('path');

(async () => {
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

  const ClientCompiler = Webpack(ClientConfig);
  const SSRCompiler = Webpack(SSRConfig);

  const memoryFilesystem = createFsFromVolume(new Volume());
  memoryFilesystem.join = path.join.bind(path); // see https://webpack.js.org/contribute/writing-a-loader/#testing

  ClientCompiler.outputFileSystem = memoryFilesystem;
  ClientCompiler.outputPath = path.join(__dirname, 'dist', 'client');

  SSRCompiler.outputFileSystem = memoryFilesystem;
  SSRCompiler.outputPath = path.join(__dirname, 'dist', 'server');

  // ClientCompiler.run((error, stats) => {
  //   if (error) {
  //     console.log(error);
  //   }
  //   console.log(memoryFilesystem.readdirSync(path.join(__dirname, 'dist', 'client')));
  // });

  ClientCompiler.run((clientError) => {
    SSRCompiler.run((SSRError) => {
      console.log('\n\n\n\n');
      console.log(memoryFilesystem.readdirSync(path.join(__dirname, 'dist', 'client')));
      console.log('\n\n\n\n');
      console.log(memoryFilesystem.readdirSync(path.join(__dirname, 'dist', 'server')));
    });
  });

  // const devServerConfig = generateClientConfig().devServer;

  // console.log(devServerConfig);

  // const server = new WebpackDevServer(ClientCompiler, devServerConfig);

  // const port = await portscanner.findAPortNotInUse(8080, 9000, '127.0.0.1');

  // server.listen(port, '127.0.0.1');
})();
