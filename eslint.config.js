import js from '@eslint/js'
import globals from 'globals'
import eslintPluginPrettier from 'eslint-plugin-prettier'

export default [
  js.configs.recommended,
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        requireConfigFile: false,
        allowImportExportEverywhere: true
      },
      globals: {
        ...globals.node,
        ...globals.es2021
      }
    },
    plugins: {
      prettier: eslintPluginPrettier
    },
    rules: {
      // Common
      'no-console': 'warn',
      'no-extra-boolean-cast': 'off',
      'no-lonely-if': 'warn',
      'no-unused-vars': 'warn',
      'no-trailing-spaces': 'warn',
      'no-multi-spaces': 'warn',
      'no-multiple-empty-lines': 'warn',
      'space-before-blocks': ['error', 'always'],
      'object-curly-spacing': ['warn', 'always'],
      indent: ['warn', 2],
      semi: ['warn', 'never'],
      quotes: ['error', 'single'],
      'array-bracket-spacing': 'warn',
      'linebreak-style': 'off',
      'no-unexpected-multiline': 'warn',
      'keyword-spacing': 'warn',
      'comma-dangle': 'warn',
      'comma-spacing': 'warn',
      'arrow-spacing': 'warn',

      // Prettier integration
      'prettier/prettier': [
        'error',
        {
          // Using .prettierrc config
          usePrettierrc: true
        }
      ]
    }
  }
]
