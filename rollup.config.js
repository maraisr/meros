import resolve from '@rollup/plugin-node-resolve';
import typescript from 'rollup-plugin-typescript2';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const shared = () => ({
	external: {
		...require('module').builtinModules,
		...Object.keys(pkg.dependencies || {}),
		...Object.keys(pkg.peerDependencies || {}),
	},
	plugins: [
		resolve({ extensions: ['.js', '.ts'] }),
		typescript({
			useTsconfigDeclarationDir: true,
		}),
	],
});

export default [
	{
		input: 'src/browser.ts',
		output: [
			{
				format: 'esm',
				file: 'browser/index.mjs',
				sourcemap: false,
			},
			{
				format: 'cjs',
				file: 'browser/index.js',
				sourcemap: false,
			},
			{
				name: pkg.name,
				format: 'umd',
				file: 'browser/index.min.js',
				sourcemap: false,
				plugins: [terser()],
			},
		],
		...shared(),
	},
	{
		input: 'src/node.ts',
		output: [
			{
				format: 'esm',
				file: 'node/index.mjs',
				sourcemap: false,
			},
			{
				format: 'cjs',
				file: 'node/index.js',
				sourcemap: false,
			},
		],
		...shared(),
	},
];
