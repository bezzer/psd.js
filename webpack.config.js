var path = require('path');
var merge = require('webpack-merge');

const sharedConfig = {
  devtool: 'source-map',
  stats: {
    errorDetails: true
  },
  output: {
    pathinfo: true
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" }
    ]
  },
};

const coreConfig = merge(sharedConfig, {
  entry: './src/psd.js',
  target: 'node',
  output: {
    filename: "psd.js",
    path: path.resolve(__dirname, 'dist'),
    libraryTarget: 'commonjs2'
  }
});

module.exports = [coreConfig]
