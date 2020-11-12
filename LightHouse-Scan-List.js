"use strict";
const readline = require("readline");
const fs = require("fs");
const {
  deviceConfigs,
  processDevice,
  isValidHttpUrl,
} = require("./LightHouse-Utils");

var myArgs = process.argv.slice(2);

let report = [];

// Process Args
let file = myArgs[0];
if (!file) {
  console.error(
    "No url listing file was specified. (Newline separated text file, 1 url per line)"
  );
  return;
}

let device = myArgs[1] || "both";
let devices = device == "both" ? ["desktop", "mobile"] : [device];
if (!myArgs[1]) {
  console.warn(
    'No devices selected [desktop|mobile|both]. The default value of "both" will be used.'
  );
}

const maxRuns = 5;
let runs = myArgs[2] || 3;
if (!myArgs[1]) {
  console.warn(
    "No number of runs was specified. The default value of 3 will be used."
  );
}
if (runs > maxRuns) {
  runs = maxRuns;
  console.warn(
    `Number of runs can be no greater than ${maxRuns}. I have set your number of runs to ${maxRuns}`
  );
}

const readInterface = readline.createInterface({
  input: fs.createReadStream(file),
  // output: process.stdout,
  console: false,
});

(async () => {
  for await (const url of readInterface) {
    if (!isValidHttpUrl(url)) {
      console.error(`Not a valid URL: ${url}`);
      continue;
    }

    console.log(`\nRunning scan on: ${url}`);

    for (const device of devices) {
      if (!deviceConfigs[device]) {
        console.error(
          `The device ${device} is not supported by this tool. Supported values: [desktop|mobile|both]. Moving on...`
        );
        continue;
      }
      let result = await processDevice(
        url,
        runs,
        device,
        deviceConfigs[device].flags,
        deviceConfigs[device].config
      );
      report.push(result);
    }
  }

  console.log(report);
  let summary = {};
  report.forEach((item) => {
    summary[item.Url] = summary[item.Url] || {};
    summary[item.Url][item.Device] = item.Average;
  });
  console.table(summary);
})();