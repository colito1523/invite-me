/** @type {import('eslint').Linter.Config} */
const config = {
    languageOptions: {
      parser: '@babel/eslint-parser', // Utiliza el parser de Babel para JSX
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true, // Habilita el soporte para JSX
        },
      },
      globals: {
        __dirname: 'readonly',
        process: 'readonly',
      },
    },
    rules: {
      'max-len': ['error', { code: 80 }],
      'quotes': ['error', 'double'],
      'indent': ['error', 2],
    },
  };
  
  module.exports = config;
  