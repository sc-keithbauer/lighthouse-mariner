# Lighthouse Mariner

A command line tool for testing multiple URLs with Google Lighthouse

## Install

```
$ npm install -g lighthouse-mariner
```

## Table of Contents

- [Lighthouse Mariner](#lighthouse-mariner)
  - [Install](#install)
  - [Table of Contents](#table-of-contents)
  - [Usage](#usage)
  - [How to](#how-to)
  - [Output](#output)
  - [License](#license)

## Usage

```sh
$ lighthouse-mariner --help
  Usage: cmd [options]

  Options:
  -s, --sites [sites]    a comma delimited list of site urls to analyze with Lighthouse
  -f, --file <path>      an input file with a site url per-line to analyze with Lighthouse
  -p, --passes <number>  How many passes should be run on each route to generate each average score? (default: 1)
  -d, --desktop-only     Only run using desktop profile
  -m, --mobile-only      Only run using mobile profile
  -q, --quiet            Hide all console output
  -V, --version          output the version number
  -h, --help             display help for command
```

## How to

### Use --sites flag

```
$ lighthouse-mariner -s http://www.google.com
```
Multiple sites:
```
$ lighthouse-mariner -s http://www.google.com,http://www.yahoo.com
```

### Use --file usage
Create a text file containing each URL you would like to audit (1 per line). This example can be found in the `examples/` folder of the repo.

`url-list.txt:`

```
https://www.google.com
https://www.yahoo.com
https://www.msn.com
https://www.bing.com
```

To run audit on files:

```
$ lighthouse-mariner -f ./url-list.txt
```

## Output

### Console

If the `-q` flag is not used, the console will show the progress of each scan as it completes.

The console will also display a table of the results when completed.

### Folder

A folder is generated in your working directory (if it doesn't already exist), named `lighthouse-mariner-reports/`. All output files will be created here.

### JSON

As the script runs lighthouse on each URL, it will add the latest scan info to a `audit-{TIMESTAMP}.report.json` file. (If the script ends prematurely for any reason, the latest data will be available in this file.)

### HTML

When the script completes, it will create an HTML report: `audit-{TIMESTAMP}.report.html`.

## License

ISC