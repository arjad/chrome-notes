const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require("copy-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
    mode: 'production', // or 'development'
    entry: {
        popup: './src/popup.jsx',
        settings: "./src/settings/settings.jsx",
    },
    output: {
      filename: '[name].js',
      path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [{
            test: /\.(js|jsx)$/, 
            exclude: /node_modules/, 
            use: {
                loader: 'babel-loader',
                options: {
                    presets: ['@babel/preset-env', '@babel/preset-react']
                }
            } 
          }, 
          {
            test: /\.css$/i,
            use: ["style-loader", "css-loader"],
          },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html',
            chunks: ['popup']
        }),
        new HtmlWebpackPlugin({
          template: './src/settings/settings.html',
          filename: 'settings.html',
          chunks: ['settings']
        }),
        new CopyPlugin({
            patterns: [
              { from: "public" },
            ],
        }),
    ],
};
