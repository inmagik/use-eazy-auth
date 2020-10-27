import babel from '@rollup/plugin-babel'
import pkg from './package.json'

const vendors = []
  // Make all external dependencies to be exclude from rollup
  .concat(
    Object.keys(pkg.dependencies || {}),
    Object.keys(pkg.peerDependencies || {})
  )

const makeExternalPredicate = (externalArr) => {
  if (externalArr.length === 0) {
    return () => false
  }
  const pattern = new RegExp(`^(${externalArr.join('|')})($|/)`)
  return (id) => pattern.test(id)
}

export default ['esm', 'cjs'].map((format) => ({
  input: {
    index: 'src/index.js',
    routes: 'src/routes/index.js',
  },
  output: [
    {
      dir: 'lib',
      entryFileNames: '[name].[format].js',
      exports: 'named',
      format,
    },
  ],
  external: makeExternalPredicate(vendors),
  plugins: [
    babel({
      babelHelpers: 'runtime',
      exclude: 'node_modules/**',
      plugins: [
        [
          '@babel/plugin-transform-runtime',
          {
            useESModules: format === 'esm',
          },
        ],
      ],
    }),
  ],
}))
