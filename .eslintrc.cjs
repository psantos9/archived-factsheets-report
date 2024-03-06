/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')
const stylistic = require('@stylistic/eslint-plugin')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    '@vue/eslint-config-typescript'
  ],
  plugins: ['@stylistic'],
  rules: {
    ...stylistic.configs.customize({
      indent: 2,
      quotes: 'single',
      semi: false,
      commaDangle: 'never'
    }).rules
  },
  parserOptions: {
    ecmaVersion: 'latest'
  }
}
