module.exports = {
    env: {
      node: true,
      es6: true,
    },
    extends: ['eslint:recommended', 'plugin:node/recommended'],
    parserOptions: {
      ecmaVersion: 2018,
    },
    rules: {
      // Add your rules here
      'no-console': 'off', // You may want to allow console statements in development
      'no-unused-vars': ['error', { args: 'all', argsIgnorePattern: '^_' }],
      'node/no-unpublished-require': 'off', // You may want to enable this rule for production
    },
  };
  