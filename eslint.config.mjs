import { defineConfig } from 'eslint/config';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import { FlatCompat } from '@eslint/eslintrc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([{
  extends: compat.extends('google'),
  plugins: {},

  languageOptions: {
    globals: {
      ...globals.browser,
    },

    ecmaVersion: 'latest',
    sourceType: 'module',
  },

  settings: {},

  rules: {
    'require-jsdoc': 0,
    'valid-jsdoc': 0,
    'max-len': 0,
    'object-curly-spacing': [2, 'always'],
    'space-in-parens': ['error', 'never'],
  },
}]);
