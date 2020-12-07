"use strict";
const { getNiceDate } = require("../utils");

const path = require('path');
const fs = require("fs");
var pathToModule = path.dirname(path.dirname(__dirname));
const styles = fs.readFileSync(pathToModule + "/css/html-report.css", 'utf8')

module.exports = htmlOutput;

function htmlOutput(obj) {
  return `
    <html>
      <head>
        <style>${styles}</style>
      </head>
      <body>
        <div class="content">
          <h1>Lighthouse Report - ${getNiceDate()}</h1>
          <table>
              <thead>
                  ${getTableHeaders(obj)}
              </thead>
              <tbody>
                  ${getTableGuts(obj)}
              </tbody>
          </table>
        </div>
      </body>
    </html>`;
}

function getTableHeaders(obj) {
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

function getTableGuts(obj) {
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

function cell(data, className) {
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
  if (score >=50 && score <= 89) return 'orange';
  if (score >= 90) return 'green';
  return '';
}
