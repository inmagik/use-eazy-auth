module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        loose: true,
        modules: false,
        ...(process.env.NODE_ENV === 'test' && {
          targets: {
            node: 'current'
          }
        })
      },
    ],
    '@babel/preset-react',
  ],
  plugins: [
    process.env.NODE_ENV === 'test' &&
      '@babel/plugin-transform-modules-commonjs',
  ].filter(Boolean),
}
