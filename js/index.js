'use strict';

const fs = require('fs');
const chalk = require('chalk');
const Utils = require('./utils');
const { logger } = Utils;
const Output = require('./output');

let report = [];

module.exports = execute;

async function execute(options) {
  var hrstart = process.hrtime();

  setup(options);

  const devices = Utils.getDevices(options);
  const passes = options.passes;
  const sites = getSites(options);

  logger.log(chalk.magentaBright(`\nURLs to be scanned: ${sites.length}`));
  logger.log(chalk.magenta(`\Passes on each URL: ${passes}`));

  for (const site of sites) {
    const url = site.url;
    logger.log(chalk.cyan('\nRunning scan on: ') + chalk.green(url));

    for (const device of devices) {
      let result = await Utils.processDevice(
        url,
        passes,
        device,
        Utils.deviceConfigs[device].flags,
        Utils.deviceConfigs[device].config
      );
      report.push(result);
      Output.jsonReport(report);
    }
  }

  let summary = summarize(report);
  generateConsoleSummary(summary);
  generateHtmlSummary(summary);

  const perfTime = process.hrtime(hrstart);
  logger.log('Execution time: %ds %dms', perfTime[0], perfTime[1] / 1000000);
}

function setup(opts) {
  if (!opts.file && !opts.sites) {
    console.error('No URLs or file was specified');
    return;
  }

  if (opts.quiet) {
    logger.quietLogs();
  }

  Output.setOutputOptions(opts);
}

function getSites(options) {
  let sites = [];
  if (options.file) {
    try {
      const contents = fs.readFileSync(options.file, 'utf8');
      sites = contents.trim().split('\n');
    } catch (e) {
      console.error(`Failed to read file ${options.file}, aborting.\n`, e);
      process.exit(1);
    }
  }
  if (options.sites) {
    sites = sites.concat(options.sites.split(' '));
  }

  return sites.reduce((acc, url) => {
    acc = acc || [];
    url = url.trim();
    if (!url.match(/^https?:/)) {
      if (!url.startsWith('//')) url = `//${url}`;
      url = `https:${url}`;
    }

    if (!Utils.isValidHttpUrl(url)) {
      console.error(`Not a valid URL: ${url}`);
      return acc;
    }

    const name = Utils.siteName(url);
    const info = {
      url,
      name,
    };
    acc.push(info);
    return acc;
  }, []);
}

function summarize(report) {
  let summary = {
    scales: report[0].scales,
    scores: [],
  };

  report.forEach((item) => {
    summary.scores[item.url] = summary.scores[item.url] || {};

    // Scores average calculations
    for (let x in item.scores) {
      summary.scores[item.url][x] = summary.scores[item.url][x] || {};
      summary.scores[item.url][x][item.device] = Math.round(
        Utils.average(item.scores[x])
      );
    }

    // Metrics average calculations
    for (let x in item.metrics) {
      summary.scores[item.url]['metrics'] =
        summary.scores[item.url]['metrics'] || {};
      summary.scores[item.url]['metrics'][x] =
        summary.scores[item.url]['metrics'][x] || {};
      summary.scores[item.url]['metrics'][x][item.device] =
        summary.scores[item.url]['metrics'][x][item.device] || {};
      summary.scores[item.url]['metrics'][x][item.device].value = Utils.average(
        item.metrics[x].value
      );
      summary.scores[item.url]['metrics'][x][item.device].score = Math.round(
        Utils.average(item.metrics[x].score)
      );
    }
  });
  return summary;
}

function generateConsoleSummary(summary) {
  logger.table(summary.scores);
}

function generateHtmlSummary(summary) {
  (async () => {
    let outputHTMLFile = await Output.htmlReport(summary);
    logger.log(outputHTMLFile);
  })();
}
