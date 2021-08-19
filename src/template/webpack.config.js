const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: 'index.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
  },
  module: {},
  plugins: [
    new HtmlWebpackPlugin(),
  ],
};
