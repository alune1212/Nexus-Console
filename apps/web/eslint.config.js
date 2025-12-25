import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  globalIgnores(['dist', 'src/api/**', 'coverage/**']),  // 忽略生成的 API 代码和测试覆盖率报告
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // shadcn/ui 组件使用规范
      // 确保 UI 组件文件使用 cn() 函数（排除 utils.ts，它是 cn() 的实现）
      'no-restricted-imports': [
        'warn',
        {
          patterns: [
            {
              group: ['clsx', 'tailwind-merge'],
              message: 'Use cn() from @/lib/utils instead of importing clsx or tailwind-merge directly',
            },
          ],
        },
      ],
    },
  },
  // 排除 utils.ts（cn() 函数的实现文件）
  {
    files: ['src/lib/utils.ts'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // UI 组件特定规则
  {
    files: ['src/components/ui/**/*.{ts,tsx}'],
    rules: {
      // 确保使用 cn() 函数
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.name='clsx'], CallExpression[callee.name='twMerge']",
          message: 'Use cn() from @/lib/utils instead of clsx or twMerge directly',
        },
      ],
    },
  },
])
