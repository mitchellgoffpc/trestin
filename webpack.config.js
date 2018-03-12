const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    entry: './src/index.js',
    output: {
         path: path.resolve(__dirname, 'build'),
         publicPath: "/assets/",
         filename: 'app.bundle.js' },

    resolve: {
        extensions: ['.js'],
        modules: ['./src', './node_modules'] },

    module: {
        loaders: [
            { test: /\.js$/,
              loader: 'babel-loader',
              query: {
                  presets: ['es2015'],
                  plugins: [
                      'transform-do-expressions',
                      'transform-class-properties' ]}}]},

    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            minimize: true,
            compress: { warnings: false }}),

        new CopyWebpackPlugin([{
            from: './src/static' }])],

    stats: { colors: true },
    devtool: 'source-map' }
