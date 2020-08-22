#!/usr/bin/env node
const fs = require('fs')
const path = require('path')
const program = require('commander')
const exec = require('child_process').exec
const { version } = require('../package.json')

const download = require('download-git-repo')

program.version(version)

program
  .command('lint')
  .description('eslint . --fix')
  .action(() => {
    exec('eslint . --fix', err => {
      if (err) throw err
      console.log('eslint fix!!')
    })
  })

program
  .command('init <name>')
  .description('创建项目')
  .parse(process.argv)
  .action(name => {
    const projectPath = path.resolve(name)
    console.log(projectPath)

    if (fs.existsSync(projectPath)) {
      console.log(11111)
      const stat = fs.lstatSync()

      if (stat.isDirectory()) {
        throw new Error(`${name} Folder exist.`)
      }
    }

    // download(
    //   'https://github.com:godxiaoji/fox2app-template#master',
    //   'testtttt',
    //   err => {
    //     if (err) throw err

    //   }
    // )
  })

// program
// .command('lint')
// .description('eslint . --fix')
// .action(argv => {
//   // console.log(argv._name + ' start')
//   exec('eslint . --fix', (err, stdout, stderr) => {
//     if (err) throw err
//     console.log('eslint fix!!')
//   })
// })

program.parse(process.argv)
