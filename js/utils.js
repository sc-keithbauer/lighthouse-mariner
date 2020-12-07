"use strict";

const { throttling } = require("../config/constants.js");
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");
const chalk = require("chalk");

// Configs
const deviceConfigs = {
  desktop: {
    flags: {},
    config: {
      settings: {
        throttling: throttling.desktopDense4G,
        emulatedFormFactor: "desktop",
      },
    },
  },
  mobile: {
    flags: {},
    config: {},
  }
};


// Functions
const average = (arr) => arr.reduce((sume, el) => sume + el, 0) / arr.length;

async function runLH(url, runs, name, flags, configs) {
  flags = flags || {};
  configs = configs || {};
  const chrome = await chromeLauncher.launch({ chromeFlags: ["--headless"] });
  const options = Object.assign(
    {
      output: "json",
      onlyCategories: ["performance", "accessibility"],
      port: chrome.port,
    },
    flags
  );
  const config = Object.assign(
    {
      extends: "lighthouse:default",
    },
    configs
  );

  let scores = {};
  for (let x = 1; x <= runs; x++) {
    let runnerResult = await lighthouse(url, options, config);
    for (let x in runnerResult.lhr.categories) {
      scores[x] = scores[x] || [];
      scores[x].push(
        Math.round(runnerResult.lhr.categories[x].score * 100)
      );
    }
  }

  await chrome.kill();

  return {
    name: name,
    url: url,
    scores: scores,
  };
}

function displayResults(results) {
  let display = {
    device: results.name,
    url: results.url,
    scores: results.scores,
  }
  return display;
}

function write(msg) {
  process.stdout.write(msg)
}
function clearWrite(msg) {
  process.stdout.clearLine();
  process.stdout.cursorTo(0);
  process.stdout.write(msg);
}

async function processDevice(url, runs, device, flags, config, quiet) {
  if (!quiet) process.stdout.write(`${device.capitalize()}: running...`);
  // TODO: capture time before/after lh runs better
  // console.time(device);
  let results = await runLH(url, runs, device, flags, config);

  if (!quiet) process.stdout.clearLine();
  if (!quiet) process.stdout.cursorTo(0);
  if (!quiet) process.stdout.write(`${device.capitalize()}:\n`);
  if (!quiet) process.stdout.write(`\tPerformance:\t ${displayScore(Math.round(average(results.scores.performance)))}`);
  if (!quiet) process.stdout.write(`\tAccessibility:\t ${displayScore(Math.round(average(results.scores.accessibility)))}\n`);

  let display = displayResults(results);
  // console.timeEnd(device);
  return display;
}

String.prototype.capitalize = function() {
  return this.charAt(0).toUpperCase() + this.slice(1)
}

function displayScore(val)
{
  let color = chalk.green;
  if (val <= 49) {
    color = chalk.red
  }
  if (val > 49 && val <= 89) {
    color = chalk.yellow
  }
  return color(val)
}

function isValidHttpUrl(string) {
  let url;

  try {
    url = new URL(string);
  } catch (_) {
    return false;
  }

  return url.protocol === "http:" || url.protocol === "https:";
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
    return dateLocal.toISOString().slice(0, 19).replace(/[\/]/gi, "-").replace(/:/gi, '').replace("T", "_");
  }
  return dateLocal.toISOString().slice(0, 19).replace(/-/g, "/").replace("T", " ");
}

module.exports = {
    processDevice,
    deviceConfigs,
    isValidHttpUrl,
    average,
    write,
    clearWrite,
    getDate,
    getNiceDate
}