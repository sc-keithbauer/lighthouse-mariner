'use strict';

const path = require('path');
const fs = require('fs');
var pathToModule = path.dirname(path.dirname(__dirname));
const styles = fs.readFileSync(pathToModule + '/css/html-report.css', 'utf8');
const Utils = require('../utils');

let metrics = {
  'first-contentful-paint': 's',
  'speed-index': 's',
  'largest-contentful-paint': 's',
  interactive: 's',
  'server-response-time': 's',
  'total-blocking-time': 'ms',
  'cumulative-layout-shift': 3,
};

module.exports = htmlOutput;

function htmlOutput(obj) {
  return `
    <html>
      <head>
        <style>${styles}</style>
      </head>
      <body>
        <div class="content">
          <h1>Lighthouse Report - ${Utils.getNiceDate()}</h1>

          <h2>Overall Scores</h2>
          <table class="scores">
              <thead>
                  ${getScoreTableHeaders(obj.scores)}
              </thead>
              <tbody>
                  ${getScoreTableGuts(obj.scores)}
              </tbody>
          </table>

          <h2>Performance Metrics</h2>
          ${getMetricsTables(obj)}

        </div>
      </body>
    </html>`;
}

function getScoreTableHeaders(obj) {
  return `
    <tr>
        <th rowspan='2' class="url-header">URL</th>
        <th colspan="2" class="performance">Performance</th>
        <th colspan="2" class="accessibility">Accessibility</th>
    </tr>
    <tr>
        <th class="desktop">Desktop</th>
        <th class="mobile">Mobile</th>
        <th class="desktop">Desktop</th>
        <th class="mobile">Mobile</th>
    </tr>`;
}

function getScoreTableGuts(obj) {
  let out = Object.entries(obj).map(([key, item]) => {
    let row = `
        <tr>
            ${cell(key, 'url')}
            ${cellScore(item.performance.desktop)}
            ${cellScore(item.performance.mobile)}
            ${cellScore(item.accessibility.desktop)}
            ${cellScore(item.accessibility.mobile)}
        </tr>`;
    return row;
  });
  return out.join('');
}

function msToSec(val) {
  return (val / 1000).toFixed(1);
}

function convertMetric(key, val) {
  if (!metrics[key]) return val;
  if (metrics[key] == 's') return msToSec(val);
  if (metrics[key] == 'ms') return parseFloat(val).toFixed(0);
  return val.toFixed(metrics[key]);
}

function getMetricsTables(obj) {
  const devices = Utils.getDevices();

  let tables = devices.map((device) => {
    let metricTitles = Object.entries(
      obj.scores[Object.keys(obj.scores)[0]].metrics
    ).map(([key, _item]) => {
      return `<th class="metric" colspan="2">${titleCase(key)} (${
        obj.scales[key]
      }%)</th>`;
    });

    let rows = Object.entries(obj.scores).map(([url, data]) => {
      let cells = [cell(url, 'url')];

      cells.push(
        cell(data.performance[device], [
          'metric',
          getScoreClass(data.performance[device]),
        ])
      );

      Object.entries(data.metrics).forEach(([key, item]) => {
        let metricScore = item[device].score,
          metricValue = item[device].value,
          cellClass = ['metric', key, getScoreClass(metricScore)];
        cells.push(
          cell(convertMetric(key, metricValue), [
            ...cellClass,
            'convert-' + metrics[key],
          ]),
          cell(metricScore, [...cellClass, 'metric_score'])
        );
      });
      return `<tr>${cells.join('')}</tr>`;
    });

    return `
      <h3>${device.capitalize()}</h3>
      <table class="metrics">
        <thead>
          <tr>
            <th colspan="100%">${device.capitalize()}</th>
          </tr>
          <tr>
            <th>URL</th>
            <th>Overall Score</th>
            ${metricTitles.join('')}
          </tr>
        </thead>
        <tbody>
          ${rows.join('')}
        </tbody>
      </table>
    `;
  });

  return tables.join('');
}

function cellHeader(data, className) {
  className = Array.isArray(className) ? className.join(' ') : className;
  if (className) return `<th class="${className}">${data}</th>`;
  return `<th>${data}</th>`;
}
function cell(data, className) {
  className = Array.isArray(className) ? className.join(' ') : className;
  if (className) return `<td class="${className}">${data}</td>`;
  return `<td>${data}</td>`;
}
function cellScore(data) {
  data = data || data === 0 ? data : '';
  return cell(data, getScoreClass(data));
}

function getScoreClass(score) {
  if (isNaN(score)) return '';
  if (score <= 49) return 'red';
  if (score >= 50 && score <= 89) return 'orange';
  if (score >= 90) return 'green';
  return '';
}

function titleCase(input) {
  let sentence = input.toLowerCase().split('-');
  for (let i = 0; i < sentence.length; i++) {
    sentence[i] = sentence[i][0].toUpperCase() + sentence[i].slice(1);
  }
  return sentence.join(' ');
}
