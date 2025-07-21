const path = require('path');

module.exports = {
  entry: './wat-compiler.js',
  output: {
    filename: 'wat-compiler-bundle.js',
    path: path.resolve(__dirname, 'dist'),
    library: 'WatCompiler',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }
    ]
  },
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer"),
      "util": require.resolve("util")
    }
  },
  plugins: [
    // Add polyfills for Node.js modules
    new (require('webpack')).ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser'
    })
  ]
}; 