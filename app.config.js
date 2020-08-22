const fs = require('fs')
const path = require('path')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const AppPlugin = require('./app-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin')
// const { CleanWebpackPlugin } = require('clean-webpack-plugin')

const cmdPath = './'
const tempPath = path.resolve(__dirname, './cache')
let appData = fs.readFileSync(path.resolve(cmdPath, './src/app.json'))
appData = JSON.parse(appData)

const entries = () => {
  const ret = {}

  appData.pages.forEach(v => {
    ret[v] = path.resolve(tempPath, `./${v}.js`)
  })

  ret['app-service'] = path.resolve(tempPath, './app-service.js')
  ret['config-service'] = path.resolve(tempPath, './config-service.js')

  return ret
}

const output = {
  path: path.resolve(cmdPath, './dist'),
  filename: '[name].js'
}

const getPlugins = (mode) => {
  const ret = []

  // 业务页面
  appData.pages.forEach(v => {
    ret.push(
      new HtmlWebpackPlugin({
        filename: v + '.html', //打包后的文件名
        minify: {
          //对html文件进行压缩
          removeAttributeQuotes: true, //去掉属性的双引号
          removeComments: true, //去掉注释
          collapseWhitespace: true //去掉空白
        },
        chunks: [v], //每个html只引入对应的js和css
        inject: true,
        hash: false, //避免缓存js。
        template: path.resolve(__dirname, './frame/page.html') //打包html模版的路径和文件名称
      })
    )
  })

  // 用户逻辑页面
  ret.push(
    new HtmlWebpackPlugin({
      filename: 'index.html',
      minify: {
        removeAttributeQuotes: true,
        removeComments: true,
        collapseWhitespace: true
      },
      chunks: ['config-service'],
      inject: 'head',
      hash: false, //避免缓存js。
      template: path.resolve(__dirname, './frame/index.html') //打包html模版的路径和文件名称
    })
  )

  // 用户逻辑页面
  ret.push(
    new HtmlWebpackPlugin({
      filename: 'logic.html',
      minify: {
        removeAttributeQuotes: true,
        removeComments: true,
        collapseWhitespace: true
      },
      chunks: ['app-service'],
      inject: true,
      hash: false, //避免缓存js。
      template: path.resolve(__dirname, './frame/logic.html') //打包html模版的路径和文件名称
    })
  )

  ret.push(
    new AppPlugin({
      src: 'src',
      pages: appData.pages,
      tempPath,
      mode
    })
  )

  ret.push(
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.join(cmdPath, './src/app.json'),
          to: path.join(output.path, './app.json')
        },
        {
          from: path.join(cmdPath, './project.config.json'),
          to: path.join(output.path, 'project.config.json')
        },
        {
          from: path.join(__dirname, './frame/libs/'),
          to: path.join(output.path, './libs')
          // ignore: ["*.html"],
        }
      ],
      options: {}
    })
  )

  ret.push(
    new MiniCssExtractPlugin({
      filename: '[name].css'
    })
  )

  ret.push(
    new OptimizeCSSAssetsPlugin({
      cssProcessorPluginOptions: {
        preset: [
          'default',
          {
            discardComments: { removeAll: true },
            normalizeUnicode: false
          }
        ]
      },
      canPrint: false
    })
  )

  ret.push(new VueLoaderPlugin())

  return ret
}

module.exports = function getConfig(mode = 'production') {
  return {
    mode,
    // devtool: 'source-map',
    resolve: {
      alias: {
        '@': path.resolve(cmdPath, './src')
      }
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          // exclude: /node_modules/,
          use: ['vue-loader']
        },
        {
          test: /\.css$/,
          // exclude: /node_modules/,
          use: [
            {
              loader: MiniCssExtractPlugin.loader,
              options: {
                esModule: true,
                hmr: process.env.NODE_ENV === 'development'
              }
            },
            'css-loader'
          ]
        }
      ]
    },
    entry: entries(),
    output,
    plugins: getPlugins(mode),
    watchOptions: {
      poll: 1000, //监测修改的时间(ms)
      aggregateTimeout: 500, //防止重复按键，500毫米内算按键一次
      ignored: [/node_modules/, new RegExp(tempPath)]
    }
  }
}
