module.exports = {
  root: true,
  env: {
    browser: true,
    node: true,
  },
  parserOptions: {
    parser: 'babel-eslint',
    ecmaVersion: 2020,
  },
  extends: ['plugin:vue/essential', '@vue/prettier'],
  plugins: ['vue'],
  rules: {
    'prettier/prettier': 'error',
    'vue/multi-word-component-names': 'off',
  },
}