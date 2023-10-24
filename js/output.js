'use strict';

import fs from 'fs';
import generateHtmlOutput from './output/html.js';
import { logger, getDataLookup, getNiceDate } from './utils.js';
import mkdirp from 'mkdirp';

let outputFileName = null;
let outputDir = null;

function setOutputOptions(options) {
  // Create output directory
  outputDir = options.outputDirectory;
  mkdirp(outputDir);
}

function getOutputFileName(lookupId) {
  let reportFilename = getFileName();
  let extensions = getExtensions();
  let outputs = {};
  for (const [type, ext] of Object.entries(extensions)) {
    outputs[type] = outputDir + '/' + reportFilename + ext;
  }
  return getDataLookup(outputs, lookupId);
}

function getExtensions(lookupId) {
  const outputs = {
    json: '.report.json',
    html: '.report.html',
  };
  return getDataLookup(outputs, lookupId);
}

function getFileName() {
  if (outputFileName != null) {
    return outputFileName;
  }
  let date = getNiceDate(true),
    extensions = getExtensions(),
    fileName = null,
    fileNum = 0;
  while (fileName == null) {
    let fileNumOut = fileNum == 0 ? '' : ` (${fileNum})`,
      fileCheck = 'audit-' + date + fileNumOut,
      collision = false;
    for (const [_type, ext] of Object.entries(extensions)) {
      if (fs.existsSync(outputDir + '/' + fileCheck + ext)) {
        collision = true;
      }
    }
    if (!collision) {
      fileName = fileCheck;
    }
    fileNum++;
  }
  outputFileName = fileName;
  return fileName;
}

function jsonReport(json) {
  let outputJSONFile = getOutputFileName().json;
  fs.writeFile(outputJSONFile, JSON.stringify(json), function (err) {
    if (err) return logger.log(err);
  });
  return outputJSONFile;
}

function htmlReport(obj) {
  let outputHTMLFile = getOutputFileName().html;
  fs.writeFile(outputHTMLFile, generateHtmlOutput(obj), function (err) {
    if (err) return logger.log(err);
  });
  return outputHTMLFile;
}

export default {
  getExtensions,
  setOutputOptions,
  jsonReport,
  htmlReport,
};
