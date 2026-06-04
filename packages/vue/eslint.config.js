import tseslint from 'typescript-eslint'
import vue from 'eslint-plugin-vue'

export default tseslint.config(
  {
    ignores: ['dist/**'],
  },
  ...vue.configs['flat/recommended'],
  // TypeScript parser for .ts files
  {
    files: ['src/**/*.ts'],
    ...tseslint.configs.recommended[0],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        parser: {
          ts: tseslint.parser,
          js: vue.parser,
        },
      },
    },
  },
  // Vue files use vue-eslint-parser with TypeScript
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parser: vue.parser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'vue/no-unused-vars': 'warn',
    },
  },
)