const sharedConfig = require('../jest.config.js')

module.exports = {
  ...sharedConfig,
  testMatch: ['**/test/**/*.spec.ts'],
}
