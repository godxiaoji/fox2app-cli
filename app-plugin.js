const fs = require('fs')
const path = require('path')
const { isObject } = require('util')

function kebabCase2CamelCase(name) {
  name = name.replace(/-(\w)/g, (all, letter) => {
    return letter.toUpperCase()
  })
  return name.substr(0, 1).toLowerCase() + name.substr(1)
}

/**
 * 小程序架构解析插件
 * @author Travis
 */

class AppPlugin {
  constructor(options) {
    // 根据 options 配置你的插件
    this.sourcePath = path.resolve(options.src)
    this.pages = options.pages
    this.tempPath = options.tempPath
    this.mode = options.mode
  }

  apply(compiler) {
    compiler.hooks.compile.tap('AppPlugin', () => {
      // console.log(params)
      this.createTempFiles()
    })

    // compiler.hooks.compilation.tap('AppPlugin', compilation => {
    //   console.log(compilation.chunks)
    // })

    compiler.hooks.emit.tapAsync('AppPlugin', (compilation, callback) => {
      const manifest = {}
      for (const name of Object.keys(compilation.assets)) {
        manifest[name] = compilation.assets[name].size()
        // 将生成文件的文件名和大小写入manifest对象

        if (this.mode === 'production') {
          if (name === 'app-service.js') {
            const newOutput = `(function(window,document,history,localStorage,location,parent,frames,frameElement){var __logicData={};${compilation.assets[
              name
            ].source()}})()`
            compilation.assets[name] = {
              source() {
                return newOutput
              },
              size() {
                return this.source().length
              }
            }
          }
        }
      }
      compilation.assets['manifest.json'] = {
        source() {
          return JSON.stringify(manifest)
        },
        size() {
          return this.source().length
        }
      }
      callback()
    })

    compiler.hooks.afterEmit.tapAsync('AppPlugin', (compilation, callback) => {
      // console.log(process.env.NODE_ENV)
      if (this.mode === 'production') {
        // 删除临时文件
        this.deleteFolderRecursive(this.tempPath)
      }

      callback()
    })
  }

  createTempFiles() {
    // 创建临时处理目录
    if (!fs.existsSync(this.tempPath)) {
      fs.mkdirSync(this.tempPath)
      console.log('A  ' + this.tempPath)
    }

    // 服务层
    this.writeFile(
      'app-service',
      'js',
      `import appOptions from '@/app.js'
    const pageCtx = require.context('@/pages', true, /\\.js$/)
    const compCtx = require.context('@/components', true, /\\.js$/)
    __$.serviceLoad({ pageCtx, compCtx, appOptions })`
    )

    this.writeFile(
      'config-service',
      'js',
      `const pageCtx = require.context('@/pages', true, /\\.json$/)
    import appJson from '@/app.json'

    export function getPageCtx() {
      return pageCtx
    }

    export function getAppJson() {
      return appJson
    }

    window.__$ = window.__$ || {}
    window.__$.getPageCtx = getPageCtx
    window.__$.getAppJson = getAppJson`
    )

    const pageRequireComponents = []

    // 解析页面组件
    for (const page of this.pages) {
      let [htmlCont, cssCont, jsCont, jsonCont] = [
        'html',
        'css',
        'js',
        'json'
      ].map(ext => {
        const filePath = path.resolve(this.sourcePath, `${page}.${ext}`)

        return this.loadFileContent(filePath, ext)
      })

      // 解析json
      const compRequirePaths = []
      const compNames = []
      if (isObject(jsonCont.usingComponents)) {
        for (const k in jsonCont.usingComponents) {
          const compName = kebabCase2CamelCase(k)
          const compPath = jsonCont.usingComponents[k].replace(/^\//, '')

          compRequirePaths.push(
            `import ${compName} from '${this.getRelativePath(
              page,
              compPath
            )}.vue';`
          )
          compNames.push(compName)

          if (pageRequireComponents.indexOf(compPath) === -1) {
            pageRequireComponents.push(compPath)
          }
        }
      }

      jsCont =
        compRequirePaths.join('') +
        jsCont.replace(
          /^[^]*export\sdefault[\s]+\{/,
          `export default Page({route:'${page}',components:{${compNames.join(
            ','
          )}}},{`
        ) +
        ')'

      const vueTpl = `<template>${htmlCont}</template><script>${jsCont}</script><style scoped>${cssCont}</style>`
      const fileName = this.writeFile(page, 'vue', vueTpl)
      const jsTpl = `import App from './${fileName}.vue';new Vue({render: h => h(App)}).$mount('#app');`
      this.writeFile(page, 'js', jsTpl)
    }

    const allRequireComponents = []
    const addComponentPath = compPath => {
      if (allRequireComponents.indexOf(compPath) === -1) {
        allRequireComponents.push(compPath)
      }

      const jsonCont = this.loadFileContent(
        path.resolve(this.sourcePath, `${compPath}.json`),
        'json'
      )

      if (isObject(jsonCont.usingComponents)) {
        for (const k in jsonCont.usingComponents) {
          addComponentPath(jsonCont.usingComponents[k].replace(/^\//, ''))
        }
      }
    }

    for (const compPath of pageRequireComponents) {
      addComponentPath(compPath)
    }

    // 解析子组件
    for (const compPath of allRequireComponents) {
      let [htmlCont, cssCont, jsCont, jsonCont] = [
        'html',
        'css',
        'js',
        'json'
      ].map(ext => {
        const filePath = path.resolve(this.sourcePath, `${compPath}.${ext}`)

        return this.loadFileContent(filePath, ext)
      })

      // 解析json
      const compRequirePaths = []
      const compNames = []
      if (isObject(jsonCont.usingComponents)) {
        for (const k in jsonCont.usingComponents) {
          const subComponentName = kebabCase2CamelCase(k)
          const subComponentPath = jsonCont.usingComponents[k].replace(
            /^\//,
            ''
          )

          compRequirePaths.push(
            `import ${subComponentName} from '${this.getRelativePath(
              compPath,
              subComponentPath
            )}.vue';`
          )
          compNames.push(subComponentName)
        }
      }

      jsCont =
        compRequirePaths.join('') +
        jsCont.replace(
          /^[^]*export default[\s]+\{/,
          `export default Component({route:'${compPath}',components:{${compNames.join(
            ','
          )}}},{`
        ) +
        ')'

      const vueTpl = `<template>${htmlCont}</template><script>${jsCont}</script><style scoped>${cssCont}</style>`
      this.writeFile(compPath, 'vue', vueTpl)
    }
  }

  /**
   * 删除文件夹
   * @param {String} url
   */
  deleteFolderRecursive(url) {
    let files = []
    /**
     * 判断给定的路径是否存在
     */
    if (fs.existsSync(url)) {
      /**
       * 返回文件和子目录的数组
       */
      files = fs.readdirSync(url)
      files.forEach(file => {
        const curPath = path.join(url, file)
        /**
         * fs.statSync同步读取文件夹文件，如果是文件夹，在重复触发函数
         */
        if (fs.statSync(curPath).isDirectory()) {
          // recurse
          this.deleteFolderRecursive(curPath)
        } else {
          fs.unlinkSync(curPath)
        }
      })
      /**
       * 清除文件夹
       */
      fs.rmdirSync(url)
      console.log('D  ' + url)
    } else {
      console.log('给定的路径不存在，请给出正确的路径')
    }
  }

  /**
   * 写入文件
   * @param {String} page
   * @param {String} ext
   * @param {String} content
   */
  writeFile(page, ext, content) {
    /*something*/
    let pagePaths = page.split('/')
    const fileName = pagePaths.pop()

    // 轮询创建文件
    let _dir = this.tempPath
    for (let i = 0; i < pagePaths.length; i++) {
      _dir = _dir + '/' + pagePaths[i]

      if (!fs.existsSync(_dir)) {
        fs.mkdirSync(_dir)
      }
    }

    fs.writeFileSync(`${_dir}/${fileName}.${ext}`, content)

    return fileName
  }

  /**
   * 获取两个path之间的相对地址
   * @param {String} a 当前路径
   * @param {String} b 引入路径
   */
  getRelativePath(a, b) {
    let arr = a.split('/')
    return arr
      .map((v, k) => {
        return k === arr.length - 1 ? b : '..'
      })
      .join('/')
  }

  /**
   * 读取文件内容
   * @param {String} filePath 文件地址
   * @param {String} ext 文件后缀
   */
  loadFileContent(filePath, ext) {
    if (ext === 'json') {
      const ret = fs.existsSync(filePath)
        ? fs.readFileSync(filePath).toString().trim()
        : '{}'

      try {
        return JSON.parse(ret)
      } catch (e) {
        return {}
      }
    }

    return fs.existsSync(filePath)
      ? fs.readFileSync(filePath).toString().trim()
      : ''
  }
}

module.exports = AppPlugin
