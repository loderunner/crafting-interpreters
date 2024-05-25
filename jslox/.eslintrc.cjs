/** @type {import('eslint').ESLint.ConfigData} */
module.exports = {
  root: true,
  env: { es2022: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:n/recommended',
    'prettier',
  ],
  ignorePatterns: ['.eslintrc.cjs'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        ignoreRestSiblings: true,
      },
    ],
    'n/hashbang': 'off',
    'n/no-process-exit': 'off',
    'n/no-unsupported-features/node-builtins': 'off',
  },
};
