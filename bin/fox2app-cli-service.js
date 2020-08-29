#!/usr/bin/env node
const program = require('commander')
const { version } = require('../package.json')
const shell = require('shelljs')
const path = require('path')
const chalk = require('chalk')

function echoError(message) {
  console.log(chalk.red('Error: ' + message))
}

function echoSuccess(message) {
  console.log(chalk.green(message))
}

/**
 * 获取配置文件地址
 * @param {String} configFileName 配置文件名
 */
function getConfigPath(configFileName) {
  return path
    .relative('./', path.resolve(__dirname, `../webpack/${configFileName}`))
    .replace(/\\/g, '/')
}

program.version(version)

program.command('lint').action(function () {
  shell.exec(`eslint . --fix`)
  echoSuccess('The eslint done.')
})

program.command('build').action(function () {
  shell.exec(
    `webpack --mode=production --config=${getConfigPath('prod.config.js')}`
  )
})

program.command('serve').action(function () {
  shell.exec(
    `webpack-dev-server --mode=development --config=${getConfigPath(
      'dev.config.js'
    )}`,
    function (code, stdout, stderr) {
      if (stderr) {
        echoError(stderr)
      }
    }
  )
})

program.parse(process.argv)
