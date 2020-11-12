"use strict";

const { throttling } = require("./config/constants.js");
const lighthouse = require("lighthouse");
const chromeLauncher = require("chrome-launcher");

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
      onlyCategories: ["performance"],
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

  let scores = [];
  for (let x = 1; x <= runs; x++) {
    let runnerResult = await lighthouse(url, options, config);
    scores.push(
      Math.round(runnerResult.lhr.categories.performance.score * 100)
    );
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
    "Device": results.name,
    "Url": results.url,
    "Scores": results.scores.join("-"),
    "Average": Math.round(average(results.scores)),
  }
  console.table(display);
  return display;
  // console.log(url);
  // console.log('Score - ', Math.round(average(results.scores)), ' (' + results.scores.join("-") + ')');
}

async function processDevice(url, runs, device, flags, config) {
  console.log(`\nRunning performance scan for: ${device}`);
  console.time(device);
  let results = await runLH(url, runs, device, flags, config);
  let display = displayResults(results);
  console.timeEnd(device);
  return display;
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

module.exports = {
    processDevice: processDevice,
    deviceConfigs: deviceConfigs,
    isValidHttpUrl: isValidHttpUrl,
}