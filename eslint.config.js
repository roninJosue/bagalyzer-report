// Import plugins directly
import importPlugin from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';

// Import configurations
import airbnbBase from 'eslint-config-airbnb-base';
import prettierConfig from 'eslint-config-prettier';

// Helper function to get prettier recommended config
const prettierRecommended = {
  plugins: {
    prettier: prettierPlugin,
  },
  rules: {
    'prettier/prettier': 'error',
    ...prettierPlugin.configs.recommended.rules,
  },
};

export default [
  {
    ignores: ['node_modules/', 'output/', 'data/', '*.json', '*.csv', '*.lock'],
  },
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        navigator: 'readonly',
        // Node.js globals
        process: 'readonly',
        module: 'readonly',
        require: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        // ES2021 globals
        Promise: 'readonly',
        Map: 'readonly',
        Set: 'readonly',
        WeakMap: 'readonly',
        WeakSet: 'readonly',
        BigInt: 'readonly',
        console: 'readonly',
        // Add any other globals you want to allow
      },
    },
  },
  // Apply Airbnb base configuration (without using extends)
  {
    rules: {
      ...airbnbBase.rules,
    },
    settings: {
      ...airbnbBase.settings,
    },
  },
  // Apply Prettier configuration (without using extends)
  {
    rules: {
      ...prettierConfig.rules,
    },
  },
  // Apply Prettier recommended configuration
  prettierRecommended,
  // Configure additional plugins and rules
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      'no-console': 'off',
      'import/extensions': ['error', 'ignorePackages'],
    },
    // Ensure no extends key is used
  },
];
