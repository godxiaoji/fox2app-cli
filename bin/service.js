#!/usr/bin/env node
const program = require('commander')
const { version } = require('../package.json')

program.version(version)

program.parse(process.argv)
