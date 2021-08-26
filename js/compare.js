'use strict';

const fs = require('fs');
const chalk = require('chalk');
// const Utils = require('./utils');
const { logger, getNiceDate } = require('./utils');
const _ = require('lodash');
const sass = require('node-sass');
const nunjucks = require('nunjucks');
nunjucks.configure(__dirname + '/templates');

let definitions = {};
let graphData = {};

module.exports = compare;

async function compare(options) {
  logger.log(
    chalk.cyan('Importing audit files: ') + chalk.green(options.folder)
  );

  var tries = [options.folder, 'lighthouse-mariner-reports/' + options.folder];
  let dir;
  for (let tryDir of tries) {
    if (await fs.existsSync(tryDir)) {
      dir = tryDir;
      break;
    }
  }

  if (!dir) {
    console.error('Folder not found: ' + options.folder);
    return;
  }

  let files = fs.readdirSync(dir).filter((fn) => fn.endsWith('.json'));

  files.forEach((item) => {
    let data = JSON.parse(fs.readFileSync(dir + '/' + item).toString());

    if (!Array.isArray(data)) {
      return; // not a audit scan from mariner
    }

    if (data.info) {
      parseData();
      return;
    }
    parseOldData(data, item);
  });


  definitions.scores = getScoreDefinitions(graphData);
  definitions.metrics = getMetricDefinitions(graphData);

  // generate graph lines array for each url/device
  let chartData = generateChartData(graphData);
  // fs.writeFileSync(
  //   dir + '/latest_compare_data.json',
  //   JSON.stringify(chartData)
  // );

  var lineChartJs = fs.readFileSync(`${__dirname}/output/line-chart.js`);
  var lineChartCss = generateCss().css.toString();;

  var compareReport = nunjucks.render('compare-report.njk', {
    data: JSON.stringify(chartData),
    lineChartJs,
    lineChartCss,
  });

  let filename = `compare-report-${getNiceDate(true)}.html`;
  console.log("🚀 ~ file: compare.js ~ line 73 ~ compare ~ filename", dir + filename)
  fs.writeFileSync(`${dir}/${filename}`, compareReport);
  console.log(`Compare report generated to: ${filename}`);
}

function parseData({ info, scans }) {
  scans.forEach((scan) => {
    // let { url, device, scores, metrics } = flattenSingleValArrays(scan);
    let { url, device, scores, metrics } = scan;
    graphData[url] = graphData[url] || {};
    graphData[url][device] = graphData[url][device] || [];
    graphData[url][device].push({
      date: new Date(info.date),
      scores,
      metrics,
    });
  });
}

function parseOldData(scans, filename) {
  var date = getDateFromFilename(filename);
  parseData({
    info: {
      date,
    },
    scans,
  });
}

function generateChartData(dataset) {
  let chartData = {};
  for (const [url, lvl1] of Object.entries(dataset)) {
    for (const [device, scans] of Object.entries(lvl1)) {
      chartData[url] = chartData[url] || {};
      chartData[url][device] = chartData[url][device] || {};
      chartData[url][device].scores = chartData[url][device].scores || {};

      definitions.scores.forEach((name) => {
        chartData[url][device].scores[name] = [];
        let theseScores = chartData[url][device].scores[name];
        scans.forEach((scan) => {
          let scoreValue = average(scan.scores[name]);
          theseScores.push({
            date: scan.date,
            score: Math.round(scoreValue),
            // device,
            // value: scoreValue,
          });
        });
        theseScores.sort((a, b) => a.date - b.date);
      });

      // chartData[url][device].metrics = chartData[url][device].metrics || {};
      // definitions.metrics.forEach((name) => {
      //   chartData[url][device].metrics[name] = [];
      //   scans.forEach((scan) => {
      //     chartData[url][device].metrics[name].push({
      //       name,
      //       device,
      //       date: scan.date,
      //       score: Math.round(scan.metrics[name].score),
      //       value: scan.metrics[name].value,
      //     });
      //   });
      // });
    }
  }
  return chartData;
}

const average = (array) => array.reduce((a, b) => a + b) / array.length;

function flattenSingleValArrays(arr) {
  let out = {};
  for (const [key, val] of Object.entries(arr)) {
    if (Array.isArray(val) && val.length == 1) {
      out[key] = val[0];
      continue;
    }
    if (val == null) {
      out[key] = val;
      continue;
    }
    if (typeof val == 'object') {
      out[key] = flattenSingleValArrays(val);
      continue;
    }
    out[key] = val;
  }
  return out;
}

function getScoreDefinitions(data) {
  let first = Object.keys(data)[0];
  let second = Object.keys(data[first])[0];
  return Object.keys(data[first][second][0].scores);
}

function getMetricDefinitions(data) {
  let first = Object.keys(data)[0];
  let second = Object.keys(data[first])[0];
  return Object.keys(data[first][second][0].metrics);
}

function getDateFromFilename(filename) {
  let dateRegex =
    /(19|20)\d\d[-](0[1-9]|1[012])[-](0[1-9]|[12][0-9]|3[01])/;
  let date = filename.match(dateRegex);
  if (date && date.length) {
    return date[0];
  }
  return false;
}

function generateCss() {
  return sass.renderSync({ file: `${__dirname}/output/compare-report.scss`})
}
