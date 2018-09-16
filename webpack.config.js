const HtmlWebpackPlugin = require("html-webpack-plugin");

const isProduction = process.env.npm_lifecycle_event === "build";

module.exports = {
  entry: "./src/index.js",
  mode: "development",
  devtool: "source-map",
  output: {
    path: __dirname + "/docs",
    filename: "main.js"
  },
  devServer: {
    contentBase: "./docs"
  },
  resolve: {
    extensions: [".wasm", ".mjs", ".js"]
  },
  module: {
    rules: [
      {
        test: /\.(png|json|tmx|tsx|csv)/,
        type: "javascript/auto", // Work around native webpack json handling
        loader: "file-loader"
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "src/index.html",
      minify: isProduction && {
        collapseWhitespace: true
      },
      inlineSource: isProduction && ".(js|css)$"
    })
  ]
};
