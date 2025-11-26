import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import header from 'eslint-plugin-header'
import { globalIgnores } from 'eslint/config'

// Initialize the header plugin for ESLint flat config
header.rules.header.meta.schema = false

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    plugins: {
      header,
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      'header/header': [
        'error',
        'block',
        [
          '',
          ' * Copyright (c) Microsoft Corporation.',
          ' * Licensed under the Apache License, Version 2.0.',
          ' ',
        ],
      ],
    },
  },
])
