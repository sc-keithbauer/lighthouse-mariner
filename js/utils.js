'use strict';

const desktopConfig = require('../config/desktop-config.js');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const chalk = require('chalk');
const fs = require('fs');

var quiet = false;
var devices = null;

// Configs
const deviceConfigs = {
  desktop: {
    flags: {},
    config: desktopConfig,
  },
  mobile: {
    flags: {},
    config: {},
  },
};

// Functions
async function processDevice(url, runs, device, flags, config, tries) {
  tries = tries || 1;
  if (!quiet) process.stdout.write(`${device.capitalize()}: running...`);
  try {
    let results = await runLH(url, runs, device, flags, config);

    if (!quiet) process.stdout.clearLine();
    if (!quiet) process.stdout.cursorTo(0);
    if (!quiet) process.stdout.write(`${device.capitalize()}:\n`);

    if (!quiet) {
      process.stdout.write(
        `\tPerformance:\t ${displayScore(
          Math.round(average(results.scores.performance))
        )}`
      );
      process.stdout.write(
        `\tAccessibility:\t ${displayScore(
          Math.round(average(results.scores.accessibility))
        )}`
      );
      process.stdout.write(
        `\tSEO:\t ${displayScore(Math.round(average(results.scores.seo)))}`
      );
      process.stdout.write(
        `\tBest Practices:\t ${displayScore(
          Math.round(average(results.scores['best-practices']))
        )}\n`
      );
    }

    let display = displayResults(results);
    return display;
  } catch (err) {
    logger.error(err);

    if (tries >= 3) {
      logger.error('Tried 3 times....moving on...');
      return;
    }
    logger.log('Trying again...');
    return processDevice(url, runs, device, flags, config, ++tries);
  }
}

async function runLH(url, runs, name, flags, configs) {
  flags = flags || {};
  configs = configs || {};

  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });

  const options = Object.assign(
    {
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'seo', 'best-practices'],
      onlyAudits: ['metrics'],
      // skipAudits: ['screenshot-thumbnails', 'final-screenshot', 'full-page-screenshot'],
      port: chrome.port,
    },
    flags
  );

  const config = Object.assign(
    {
      extends: 'lighthouse:default',
    },
    configs
  );

  const performanceMetrics = [
    'first-contentful-paint',
    'speed-index',
    'largest-contentful-paint',
    'interactive',
    'total-blocking-time',
    'cumulative-layout-shift',
    'server-response-time',
    // "first-cpu-idle",
    // "estimated-input-latency",
    // "max-potential-fid",
  ];

  let scores = {},
    metrics = {},
    scales = {},
    runnerResult,
    lighthouseVersion;
  for (let x = 1; x <= runs; x++) {
    runnerResult = await lighthouse(url, options, config);

    lighthouseVersion = runnerResult.lhr.lighthouseVersion;

    // Collect Category scores
    for (let x in runnerResult.lhr.categories) {
      scores[x] = scores[x] || [];
      scores[x].push(Math.round(runnerResult.lhr.categories[x].score * 100));
    }

    // Collect Performance Metrics
    for (let x of performanceMetrics) {
      if (!runnerResult.lhr.audits[x]) {
        logger.error('Could not find audit in the results set: ' + x);
        continue;
      }
      metrics[x] = metrics[x] || {};
      metrics[x].value = metrics[x].value || [];
      metrics[x].value.push(runnerResult.lhr.audits[x].numericValue);
      metrics[x].score = metrics[x].score || [];
      metrics[x].score.push(runnerResult.lhr.audits[x].score * 100);
    }
  }

  // Collect Performance scale/weights
  for (let x of performanceMetrics) {
    let allScales = runnerResult.lhr.categories.performance.auditRefs;
    allScales.forEach((auditRef) => {
      if (x == auditRef.id) {
        scales[x] = auditRef.weight;
      }
    });
  }

  await chrome.kill();

  return {
    name,
    url,
    scores,
    metrics,
    scales,
    lighthouseVersion,
  };
}

function getDevices(options) {
  if (devices != null) return devices;
  options = options || {};
  let allowedDevices = ['desktop', 'mobile'];
  allowedDevices = options.desktopOnly ? ['desktop'] : allowedDevices;
  allowedDevices = options.mobileOnly ? ['mobile'] : allowedDevices;
  devices = allowedDevices;
  return allowedDevices;
}

const average = (arr) => arr.reduce((sume, el) => sume + el, 0) / arr.length;

function displayResults(results) {
  let display = {
    device: results.name,
    url: results.url,
    scores: results.scores,
    metrics: results.metrics,
    scales: results.scales,
    version: results.lighthouseVersion,
  };
  return display;
}

function write(msg) {
  process.stdout.write(msg);
}
function clearWrite(msg) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(msg);
}

String.prototype.capitalize = function () {
  return this.charAt(0).toUpperCase() + this.slice(1);
};

function displayScore(val) {
  let color = chalk.green;
  if (val <= 49) {
    color = chalk.red;
  }
  if (val > 49 && val <= 89) {
    color = chalk.yellow;
  }
  return color(val);
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
}

function getDate() {
  var f = new Date();
  return f.toISOString().split('T')[0];
}

function getNiceDate(fileName) {
  fileName = fileName || false;
  const now = new Date();
  const offsetMs = now.getTimezoneOffset() * 60 * 1000;
  const dateLocal = new Date(now.getTime() - offsetMs);
  if (fileName) {
    return dateLocal
      .toISOString()
      .slice(0, 19)
      .replace(/[\/]/gi, '-')
      .replace(/:/gi, '')
      .replace('T', '_');
  }
  return dateLocal
    .toISOString()
    .slice(0, 19)
    .replace(/-/g, '/')
    .replace('T', ' ');
}

function getDataLookup(obj, lookupId) {
  lookupId = lookupId || null;
  if (lookupId) {
    return obj[lookupId];
  }
  return obj;
}

function siteName(site) {
  return site.replace(/^https?:\/\//, '').replace(/[\/\?#:\*\$@\!\.]/g, '_');
}

const logger = {
  log: (msg) => {
    if (quiet) return;
    console.log(msg);
  },
  error: (msg) => {
    if (quiet) return;
    console.error('\n' + chalk.red(msg));
  },
  table: (msg) => {
    if (quiet) return;
    console.table(msg);
  },
  isLogQuiet: () => {
    return quiet;
  },
  quietLogs: () => {
    quiet = true;
  },
};

module.exports = {
  logger,
  processDevice,
  deviceConfigs,
  isValidHttpUrl,
  average,
  write,
  clearWrite,
  getDate,
  getNiceDate,
  getDataLookup,
  siteName,
  getDevices,
};
