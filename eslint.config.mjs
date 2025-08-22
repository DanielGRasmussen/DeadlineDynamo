import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierConfig from 'eslint-config-prettier';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	prettierConfig,
	{
		plugins: {
			prettier: prettierPlugin,
			'@typescript-eslint': tseslint.plugin
		},
		languageOptions: {
			parser: tseslint.parser,
			parserOptions: {
				ecmaVersion: 'latest',
				sourceType: 'module',
				project: './tsconfig.json'
			},
			globals: {
				browser: true,
				chrome: true,
				node: true
			}
		},
		files: ['src/**/*.ts'],
		rules: {
			'prettier/prettier': [
				'error',
				{
					printWidth: 100,
					tabWidth: 4,
					useTabs: true,
					semi: true,
					singleQuote: false,
					trailingComma: 'none',
					bracketSpacing: true,
					arrowParens: 'avoid',
					endOfLine: 'auto'
				}
			],
			'no-unused-vars': 'off',
			'@typescript-eslint/no-unused-vars': 'off',
			'no-undef': 'off',
			'no-constant-condition': ['error', { checkLoops: false }]
		}
	},
	{
		ignores: ['node_modules/**', 'dist/**', 'third_party/**']
	}
);