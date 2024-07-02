# ♤♡ Dinger Poker ♢♧

**Live site**: https://mcqwertywhat.github.io/dinger-poker

Dinger Poker displays stats (i.e. reports) from poker games. Each report's data is in a CSV file, where each CSV file is data from a different query (a particular year, type of game, etc.)

## Add a new report

1. Add a CSV file to the `data` folder.
2. Add an entry in the `reports.json` file with a filename that matches the CSV file you added.

## How-to Video

> ⚠️ Video shows links in site menu, but that has since been replaced by a dropdown selector. 

https://github.com/mcqwertywhat/dinger-poker/assets/65724195/a41ddf14-2fe6-46b1-96e2-e6f5d07e3958

## Details on adding a new report

### Adding the CSV file

We expect a CSV file that uses only the column names below. We can use some or all of the columns. The columns can be in any order.

- `#`
- `1st`
- `2nd`
- `3rd`
- `Average Hits`
- `Average Placed`
- `Bubble`
- `Buy-ins`
- `Hits`
- `Name`
- `Rebuys`
- `Times Placed`
- `Total Cost`
- `Total Take`
- `Total Winnings`

### Adding an entry to `reports.json`

Here's an example of adding a report entry with the `id` `pineapples`:

```json
{
  "2024": {
    "title": "2024",
    "filename": "2024.csv"
  },
  "pineapples": {
    "title": "When We Play for Pineapples",
    "filename": "pineapple_poker.csv"
  }
}
```

A report needs an `id`, a `title`, and a `filename`. It's easiest to just copy+paste an existing entry and replace the text with what you need for the new report. That said, keep the following in mind:

- In the entry before your new one, put a comma `,` after the `}`
- The `id` above is `pineapples`. It will appear in a url if you share a link to a specific report, like this: `https://mcqwertywhat.github.io/dinger-poker/index.html?id=pineapples`
  - It should be unique 
  - Wrap it in double quotes `"`
  - It should use only letters, numbers, underscores, and dashes (no spaces or special characters)
- The `title` is text that will appear on the site. It is displayed as the link to the report and as the heading for the report.
  - Put a comma `,` at the end of its entry line
  - Wrap it in double quotes `"`
- The `filename` will not appear anywhere on the site
  - Use only letters, numbers, underscores, and dashes. (_Other characters might work....but sticking with these will definitely work._)
  - Wrap it in double quotes `"`
- On the line after the `filename`, make sure there is a closing curly brace `}`

**Do not** change the name of the `reports.json` file or the name of the `data` folder

### Replace an existing report

If you want to refresh the data from a report, just replace its CSV file in the `data` folder with a file of the same name.

### Delete a report

Just remove its entry in `reports.json` and remove its CSV file.

## Stale Data

Let's say you just uploaded a new report. It's possible, if you have your browser open to the site while you upload the report, that you will not see the uploaded data. If this happens, just close the tab with the site and open a new one. 

# Dev Notes

## Background 

The code in this site was initially exported from Tournament Director. it was a single HTML file with styles and script tags. The CSS and JS was separated but some original code remai s (all the sorting functionality). The main code that was added was to allow a CSV upload that would display the data. This app is, essentially a CSV display tool where we expect certain header names in the CSV file. Of course, this isn't the optimal solution (ideally we'd host a database and query it directly), but this solution is free and fills a basic requirement of displaying reports online.

## Caching 

Because we're reading CSV files and displaying that data, we have a caching system in place where we store all data from the CSV files in local storage, and only read  directly from the files themselves if the data isn't found in local storage. We also store a value in local storage that holds the last visited time of the user. We also have a value in session storage that checks the time of the latest commit to the 'data' folder in this github repo. If the value of the users last visit is earlier than the latest commit to the data folder, we fetch all new data from the CSV files.
