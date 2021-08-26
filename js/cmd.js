#!/usr/bin/env node
'use strict';

const commander = require('commander'); // (normal include)
const program = new commander.Command();
const execute = require('./index');
const compare = require('./compare');

program
  .command('scan', { isDefault: true })
  .description('scan a list of urls to gather Google lighthouse scores')
  .option(
    '-s, --sites [sites]',
    'a comma delimited list of site urls to analyze with Lighthouse'
  )
  .option(
    '-f, --file <path>',
    'an input file with a site url per-line to analyze with Lighthouse'
  )
  .option(
    '-p, --passes <number>',
    'How many passes should be run on each route to generate each average score?',
    1
  )
  .option(
    '-o, --output-directory <path>',
    'Directory to save output files',
    './lighthouse-mariner-reports'
  )
  .option('-d, --desktop-only', 'Only run using desktop profile')
  .option('-m, --mobile-only', 'Only run using mobile profile')
  .option('-q, --quiet', 'Hide all console output')
  .version(require('../package.json').version)
  .action((options) => {
    execute(options);
  });


program
  .command('compare')
  .description('compare sites scans over time to monitor progress')
  .option(
    '-f, --folder <path>',
    'name of a absolute path, relative path, or name of a directory within /lighthouse-mariner-reports folder'
  )
  .version(require('../package.json').version)
  .action((options) => {
    compare(options);
  });

program.parse(process.argv);

