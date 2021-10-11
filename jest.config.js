module.exports = {
  preset: '@vue/cli-plugin-unit-jest/presets/typescript-and-babel',
  transform: {
    '^.+\\.vue$': 'vue-jest',
  },
  setupFilesAfterEnv: ['expect-playwright'],
  globalSetup: './jestGlobalSetup.js',
  globalTeardown: './jestGlobalTeardown.js',
};
