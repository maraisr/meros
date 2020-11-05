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
		resolve(),
		typescript({
			useTsconfigDeclarationDir: true,
		}),
	],
});

export default [
	{
		input: ['src/browser.ts', 'src/node.ts'],
		output: [
			{
				format: 'esm',
				dir: 'dist',
				sourcemap: false,
				entryFileNames: '[name].mjs',
				chunkFileNames: '[name].mjs',
				preserveModules: true,
			},
			{
				format: 'cjs',
				dir: 'dist',
				sourcemap: false,
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				preserveModules: true,
			},
		],
		...shared(),
	},
	{
		input: 'src/browser.ts',
		output: [
			{
				name: pkg.name,
				format: 'umd',
				file: pkg.unpkg,
				sourcemap: false,
				plugins: [terser()],
			},
		],
		...shared(),
	},
];
