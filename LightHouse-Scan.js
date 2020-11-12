"use strict";

const { deviceConfigs, processDevice, isValidHttpUrl } = require("./LightHouse-Utils");
var myArgs = process.argv.slice(2);

// Process Args

let url = myArgs[0];
if (!url) {
  console.error("No URL was specified");
  return;
}
if (!isValidHttpUrl(url)) {
  console.error(`Not a valid URL: ${url}`);
  return;
}

let device = myArgs[1] || "both";
let devices = device == "both" ? ['desktop', 'mobile'] : [device];
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

// Main method

(async () => {

  for (const device of devices) {
    if (!deviceConfigs[device]) {
      console.error(`The device ${device} is not supported by this tool. Supported values: [desktop|mobile|both]. Moving on...`);
      continue;
    }

    console.log(`\nRunning scan on: ${url}`);

    await processDevice(url, runs, device, deviceConfigs[device].flags, deviceConfigs[device].config);
  }

})();