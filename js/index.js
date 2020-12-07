"use strict";

const fs = require("fs");
const chalk = require("chalk");
const mkdirp = require("mkdirp");
const { deviceConfigs, processDevice, isValidHttpUrl, average, getNiceDate } = require("./utils");
const generateHtmlOutput = require("./output/html");

const OUT = './lighthouse-mariner-reports'
const JSON_EXT = '.report.json'
const HTML_EXT = '.report.html'

let reportFilename;
let outputDir;
let outputHTML;
let outputJSON;
let report = [];
let quiet = false;

module.exports = execute;

async function execute(options) {
  if (!options.file && !options.sites) {
    console.error("No URLs or file was specified");
    return;
  }

  outputDir = options.out || OUT
  mkdirp(outputDir);
  reportFilename = getFileName();
  outputHTML = outputDir + '/' + reportFilename + HTML_EXT;
  outputJSON = outputDir + '/' + reportFilename + JSON_EXT;

  const devices = getDevices(options);
  const passes = options.passes;
  const sites = getSites(options);
  quiet = options.quiet;

  consoleLog(chalk.magentaBright(`\nURLs to be scanned: ${sites.length}`));

  for (const site of sites) {
    const url = site.url;
    consoleLog(chalk.cyan("\nRunning scan on: ") + chalk.green(url));

    for (const device of devices) {
      let result = await processDevice(url, passes, device, deviceConfigs[device].flags, deviceConfigs[device].config, quiet);
      report.push(result);
      outputJSONReport(report);
    }
  }

  let summary = {};
  report.forEach((item) => {
    summary[item.url] = summary[item.url] || {};
    for (let x in item.scores)  {
      summary[item.url][x] = summary[item.url][x] || {};
      summary[item.url][x][item.device] = Math.round(average(item.scores[x]));
    }
  });

  if (!quiet) console.table(summary);
  (async () => {
    await outputHTMLReport(summary);
    consoleLog(outputHTML)
  })()
}

function consoleLog(msg) {
  if (quiet) return;
  console.log(msg);
}

function getFileName() {
  let date = getNiceDate(true)
  let fileName = null;
  let fileNum = 0;
  while (fileName == null) {
    let fileNumOut = fileNum == 0 ? '' : ` (${fileNum})`;
    let fileCheck = 'audit-' + date + fileNumOut;
    if (!fs.existsSync(outputDir + '/' + fileCheck + JSON_EXT) && !fs.existsSync(outputDir + '/' + fileCheck + HTML_EXT)) {
      fileName = fileCheck;
    }
    fileNum++;
  }
  return fileName;
}

function outputJSONReport(json) {
  fs.writeFile(outputJSON, JSON.stringify(json), function (err) {
    if (err) return consoleLog(err);
  });
}

function outputHTMLReport(obj) {
  fs.writeFile(outputHTML, generateHtmlOutput(obj), function (err) {
    if (err) return consoleLog(err);
  });
}

function getDevices(options) {
  let devices = ['desktop', 'mobile'];
  devices = (options.desktopOnly) ? ['desktop'] : devices;
  devices = (options.mobileOnly) ? ['mobile'] : devices;
  return devices;
}

function getSites(options) {
  let sites = []
  if (options.file) {
    try {
      const contents = fs.readFileSync(options.file, 'utf8')
      sites = contents.trim().split('\n')
    } catch (e) {
      console.error(`Failed to read file ${options.file}, aborting.\n`, e)
      process.exit(1)
    }
  }
  if (options.sites) {
    sites = sites.concat(options.sites.split(' '))
  }

  return sites.reduce((acc, url) => {
    acc = acc || [];
    url = url.trim()
    if (!url.match(/^https?:/)) {
      if (!url.startsWith('//')) url = `//${url}`
      url = `https:${url}`
    }

    if (!isValidHttpUrl(url)) {
      console.error(`Not a valid URL: ${url}`);
      return acc;
    }

    const name = siteName(url);
    const info = {
      url,
      name,
      file: `${name}${JSON_EXT}`
    }
    // if (options.html) info.html = `${name}${HTML_EXT}`
    acc.push(info);
    return acc
  }, [])
}

function siteName(site) {
  return site.replace(/^https?:\/\//, '').replace(/[\/\?#:\*\$@\!\.]/g, '_')
}