module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        ...(process.env.NODE_ENV === 'test' && {
          targets: {
            node: 'current',
          },
        }),
      },
    ],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],
}
