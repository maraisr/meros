import resolve from '@rollup/plugin-node-resolve';
import types from 'rollup-plugin-dts';
import { transpileModule } from 'typescript';
import tsconfig from './tsconfig.json';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const MODULE = () => ({
	external: [
		...require('module').builtinModules,
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {}),
	],
	plugins: [
		resolve({
			extensions: ['.ts', '.js'],
			preferBuiltins: true,
		}),
		{
			name: 'typescript',
			transform(code, file) {
				if (/\.d\.ts$/.test(file)) return '';
				if (!/\.ts$/.test(file)) return code;
				// @ts-ignore
				let output = transpileModule(code, {
					...tsconfig, fileName: file,
				});
				return {
					code: output.outputText,
					map: output.sourceMapText || null,
				};
			},
		},
	],
});

const TYPES = () => ({
	plugins: [
		resolve({
			extensions: ['.ts', '.js'],
			preferBuiltins: true,
		}),
		types(),
	],
});


const make = file => ({
	format: /\.(mj|\.d\.t)s$/.test(file) ? 'esm' : 'cjs',
	sourcemap: false,
	esModule: false,
	interop: false,
	strict: false,
	file: file,
});

export default [
	{
		...MODULE(),
		input: 'src/node.ts',
		output: [
			make(pkg['exports']['./node']['import']),
			make(pkg['exports']['./node']['require']),
		],
	}, {
		...MODULE(),
		input: 'src/browser.ts',
		output: [
			make(pkg['exports']['./browser']['import']),
			make(pkg['exports']['./browser']['require']),
			{
				name: pkg.name,
				format: 'umd',
				file: pkg['unpkg'],
				sourcemap: false,
				esModule: false,
				interop: false,
				strict: false,
				plugins: [terser({
					compress: {
						hoist_funs: true,
						toplevel: true,
						unsafe: true,
					},
				})],
			},
		],
	}, {
		...TYPES(),
		input: 'src/node.ts',
		output: make('node/index.d.ts'),
	}, {
		...TYPES(),
		input: 'src/browser.ts',
		output: make('browser/index.d.ts'),
	},
];
