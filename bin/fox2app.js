#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const chalk = require('chalk')
const program = require('commander')
// const exec = require('child_process').exec
const { version } = require('../package.json')
const download = require('download-git-repo')
const shell = require('shelljs')

function echoError(message) {
  console.log(chalk.red('Error: ' + message))
}

function echoSuccess(message) {
  console.log(chalk.green(message))
}

function createProject(name) {
  name = name.split('.')[0] // 确保没有后缀

  if (fs.existsSync(name)) {
    // 如果路径存在，判断下是否目录
    const stat = fs.lstatSync(name)

    if (stat.isDirectory()) {
      // 如果存在目录，判断下目录是否为空
      const files = fs.readdirSync(name)

      if (files.length > 0) {
        echoError(
          `Folder "${path.resolve(
            name
          )}" already exists and it. And it's a non empty folder.`
        )
        shell.exit(1)
      }
    }
  }

  if (!shell.which('git')) {
    //在控制台输出内容
    echoError('Sorry, this script requires git')
    // 以退出码为code退出当前进程
    shell.exit(1)
  }

  shell.echo('Pull template from git.')
  download(
    'https://github.com:godxiaoji/fox2app-template#master',
    name,
    err => {
      try {
        if (err) throw err

        echoSuccess('Pull template success.')

        shell.cd(name)
        shell.echo('Install dependencies.')
        shell.exec('npm install --registry=https://registry.npm.taobao.org')

        echoSuccess('Install dependencies success.')

        shell.echo(chalk.blue(`\nYou should: cd ${name} & npm run serve`))

        shell.exit(0)
      } catch (err) {
        echoError(err.message)
        shell.exit(1)
      }
    }
  )
}

program
  .version(version)
  .command('create <app-name>')
  // .command('create <app-name> [options...]')
  .action(function (appName) {
    createProject(appName)
  })

program.parse(process.argv)
