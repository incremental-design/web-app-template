module.exports = async () => {
  await global.WEBPACK_DEVELOPMENT_SERVER.close();
};
