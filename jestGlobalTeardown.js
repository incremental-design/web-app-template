module.exports = async () => {
  // eslint-disable-next-line no-underscore-dangle
  await global.__WEBPACK_DEVELOPMENT_SERVER__.close();
};
