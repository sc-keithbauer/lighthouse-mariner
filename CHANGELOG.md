# 2.0.1 (2021-08-26)

## Bugfixes

* Compare was not reading new scan format properly
* Rookie move - console log wasn't cleaned up before publishing

# 2.0.0 (2021-08-26)

## Improvements

* Compare command added that scans a directory of mariner output json files, and kicks out a comparison html page
* Minor alteration to the way data is saved in output json files

# 1.3.0 (2021-02-08)

## Improvements

* Add SEO and Best Practices to captured metrics
* Add retry mechanism for failed lighthouse runs

# 1.2.0 (2021-02-08)

## Improvements

* Capture Lighthouse Version and add to output
* Add link to Google tool to show how scores are being calculated
* Update README file with latest cli params


# 1.1.0 (2021-02-05)

## Improvements

* Capture individual performance metrics, add to report json/html output
* CLI -o option allows for changing output directory
* Code refactors/reorganization

## Dependencies

* lighthouse: ^7.0.1
* commander: ^7.0.0
