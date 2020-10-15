import lernaJson from './lerna.json';
import path from 'path';
import glob from 'glob';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import commonjs from '@rollup/plugin-commonjs';
import babel from '@rollup/plugin-babel';
import scss from 'rollup-plugin-scss';

const availableFormatOutputs = [
	{ format: 'cjs', key: 'main' },
	{ format: 'esm', key: 'module' },
];

const finalConfig = lernaJson.packages
	.reduce((configs, globPattern) => {
		return [
			...configs,
			...glob.sync(globPattern).map((packagePath) => {
				const packageFullPath = path.resolve(__dirname, packagePath);

				const packageJson = require(path.resolve(
					packageFullPath,
					'package.json'
				));

				return {
					input: path.resolve(
						packageFullPath,
						packageJson.source || 'src/index.js'
					),
					external: (id) => {
						const dependencies = [
							...(Object.keys(packageJson.dependencies) || []),
							...(Object.keys(packageJson.peerDependencies) ||
								[]),
						];

						return dependencies.some(
							(dependency) => id.indexOf(dependency) === 0
						);
					},
					output: availableFormatOutputs
						.filter(({ key }) => packageJson.hasOwnProperty(key))
						.map(({ format, key }) => ({
							file: path.resolve(
								packageFullPath,
								packageJson[key]
							),
							format,
							sourcemap: true,
						})),
					plugins: [
						babel({ babelHelpers: 'runtime' }),
						commonjs(),
						peerDepsExternal(),
						scss(),
					],
				};
			}),
		];
	}, [])
	.filter((config) => !!config);

export default finalConfig;
