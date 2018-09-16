const merge = require("webpack-merge");
const config = require("./webpack.config");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const HtmlWebpackInlineSourcePlugin = require("html-webpack-inline-source-plugin");

module.exports = merge(config, {
  mode: "production",
  devtool: false,
  plugins: [
    new UglifyJsPlugin({
      sourceMap: false,
      extractComments: false
    }),
    new HtmlWebpackInlineSourcePlugin()
  ]
});
