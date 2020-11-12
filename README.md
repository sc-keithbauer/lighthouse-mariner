# Lighthouse Performance Average Scanner

## Installation
1. Run `npm i` in the directory with `package.json` file.
2. Ensure you have Google Chrome installed on your computer.

## Run a single scan
1. In cmd/powershell, run the following command: `npm run perf -- #URL# #DEVICES# #RUNS#`
    - Example: `npm run perf -- https://www.staging.oldelpaso.com both 3`
    - Parameters:
        - *#URL#* = any URL would you like to test
        - *#DEVICES#* = desktop, mobile, both
        - *#RUNS#* = integer value between 1-5

## Run a scan on a list of URLs
1. Create/save a file with one URL you would like to test on each line.
2. Run `npm run perf:list -- #FILE# #DEVICES# #RUNS#`
    - Example: `npm run perf:list -- ./test-urls.txt both 3`

