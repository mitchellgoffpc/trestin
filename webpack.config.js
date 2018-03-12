const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')

module.exports = {
    mode: process.env.NODE_ENV || 'production',
    devtool: 'source-map',
    stats: { colors: true },

    entry: './src/index.js',
    output: {
         path: path.resolve(__dirname, 'build'),
         publicPath: "/assets/",
         filename: 'app.bundle.js' },

    resolve: {
        extensions: ['.js'],
        modules: ['./src', './node_modules'] },

    module: {
        rules: [{
            test: /\.js$/,
            exclude: /node_modules/,
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['es2015'],
                    plugins: ['transform-do-expressions',
                              'transform-class-properties']}}}]},

    plugins: [
        new CopyWebpackPlugin([{ from: './src/static' }])],

    devServer: {
        contentBase: path.resolve(__dirname, 'build') }}
