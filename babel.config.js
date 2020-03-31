module.exports = {
  presets: [['@babel/preset-env'], '@babel/preset-typescript'],
  plugins: [
    [
      'babel-plugin-inline-import',
      {
        extensions: ['.xml', '.svg'],
      },
    ],

    // needed for reflect-metadata to work
    'babel-plugin-transform-typescript-metadata',

    [
      '@babel/plugin-proposal-decorators',
      {
        legacy: true,
      },
    ],
  ],
}
