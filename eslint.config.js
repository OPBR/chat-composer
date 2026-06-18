import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import react from 'eslint-plugin-react'
import vue from 'eslint-plugin-vue'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['**/dist/**', '**/node_modules/**', 'packages/demo/**'],
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['eslint.config.js', 'commitlint.config.js'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    files: ['packages/react/src/**/*.tsx', 'packages/react/src/**/*.ts'],
    plugins: {
      'react-hooks': reactHooks,
      react,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react-hooks/refs': 'off',
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  ...vue.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['packages/vue/src/**/*.vue'],
  })),
  {
    files: ['packages/vue/src/**/*.vue'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
      },
      parserOptions: {
        parser: tseslint.parser,
        extraFileExtensions: ['.vue'],
      },
    },
    rules: {
      'vue/no-unused-vars': 'warn',
      'vue/max-attributes-per-line': 'off',
      'vue/html-self-closing': 'off',
      'vue/multiline-html-element-content-newline': 'off',
    },
  },
)
