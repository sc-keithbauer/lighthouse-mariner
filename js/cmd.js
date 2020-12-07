#!/usr/bin/env node
'use strict'

const program = require('commander')
const execute = require('./index')

program
.option('-s, --sites [sites]', 'a comma delimited list of site urls to analyze with Lighthouse')
.option('-f, --file <path>', 'an input file with a site url per-line to analyze with Lighthouse')
.option('-p, --passes <number>', 'How many passes should be run on each route to generate each average score?', 1)
.option('-d, --desktop-only', 'Only run using desktop profile')
.option('-m, --mobile-only', 'Only run using mobile profile')
.option('-q, --quiet', 'Hide all console output')
.version(require('../package.json').version)
  .parse(process.argv)

execute(program)