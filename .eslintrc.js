module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  parserOptions: {
    parser: '@typescript-eslint/parser',
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:prettier/recommended',
    'prettier/@typescript-eslint',
    'plugin:promise/recommended',
  ],
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['src/migration/*'],
  rules: {
    'prettier/prettier': [
      'error',
      {
        singleQuote: true,
        trailingComma: 'es5',
      },
    ],
    'no-return-await': ['error'],
    'no-console': ['warn'],
    '@typescript-eslint/ban-types': 0,
  },
}
