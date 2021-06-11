const webpackConfig = './node_modules/@vue/cli-service/webpack.config.js';

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

console.log(`${SSRConfig}\n\n\n\n${ClientConfig}`);
