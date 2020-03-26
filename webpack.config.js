const path = require('path')
const webpack = require('webpack')
const CopyWebpackPlugin = require('copy-webpack-plugin')


module.exports = {
    mode: process.env.NODE_ENV || 'production',
    stats: { colors: true },

    entry: './src/index.js',
    output: {
         path: path.resolve(__dirname, 'build'),
         publicPath: "/assets/",
         filename: 'app.bundle.js' },

    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['./src', './node_modules'] },

    module: {
        rules: [
            { test: /worker\.js$/,
              use: { loader: 'worker-loader' }},
            { test: /\.[jt]s$/,
              exclude: /node_modules/,
              use: { loader: 'babel-loader' }}]},

    plugins: [
        new CopyWebpackPlugin([{ from: './src/static' }])],

    devServer: {
        contentBase: path.resolve(__dirname, 'build') }}
