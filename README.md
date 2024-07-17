# ♤♡ Dinger Poker ♢♧

**Live site**: https://mcqwertywhat.github.io/dinger-poker

Dinger Poker displays stats (i.e. reports) from poker games. Each report's data is in a CSV file, where each CSV file is data from a different query (a particular year, type of game, etc.)

## Quick How-to...

### Update an existing report

1. Replace its CSV file in the `data` folder with a file **of the same name**.

> **Data not refreshing after an update?** 
> 
> Let's say you just uploaded a new report. If you have your browser open to the site while you upload the report, it's possible that you will not see the uploaded data. If this happens, just close the tab where the site is open, and re-open the site in a new tab.

### Add a new report

1. Add a CSV file to the `data` folder.
2. Add an entry in `reports.json`. **Make sure the `filename` of the entry matches the CSV file you added**.

### Delete a report

1. Remove its entry in `reports.json`. 
2. Remove its CSV file.

### Set the `default` report

The default report is the one that appears first when a user navigates to the site.

1. Add the line `default: true` to the desired report in the `reports.json` file
2. Remove the line `default: true` from all reports except the one you wish to be the default.

> Technically, the `default` setting could be given to multiple reports, but only the first one that is flagged as `default` will actually be considered `default` by the app.

## Details on Adding a New Report

### Adding the CSV file for a new report

We expect a CSV file that uses only the header names below. We can use some or all of the headers. The headers and associated data can be in any order. Note that there is a fixed order on the website which overrides the order of the columns found in the CSV file.

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
- The `id` above is `pineapples`. 
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

> It's possible to share a direct link to a specific report, however you'd need to manually type some extra stuff into the URL. For example, to share a link directly to the `pineapples` report, you'd need to type the URL followed by `?id=pineapples`, like this: `https://mcqwertywhat.github.io/dinger-poker?id=pineapples` 

# Dev Notes

## Background 

When this project was first started, it was started by building on an existing codebase created for the poker stats program "Tournament Director", authored by Corey Cooper. The initial codebase was a single HTML file, thousands of lines long, with a single `<style>` and `<script>` tag, each with all the CSS and JavaScript for the entire site. From that initial base, the CSS and JS was separated, and additional code written to handle the user requirements. Some original code remains (mainly in the sorting functionality, found in `sortingMethods.js`).

The main code that was added was to allow a CSV upload that would display the data. This app is essentially just a tool that allows us to display the data from a CSV file in a table with sortable columns (albeit, with only certain valid header names expected in the CSV file). Of course, this isn't the optimal solution (ideally we'd host a database and query it directly and build our own dataset for reports with custom filters etc.). That said, this solution fills the basic requirement of: "I need a FREE way to display reports online where I already have the report data as a CSV file."

### Caching 

Because we're reading CSV files to get our data, we cache all data from the CSV files in local storage. We only read directly from the files themselves if:
a) the data isn't found in local storage 
or
b) the CSV data has been updated since the user's last visit to the site
or
c) the user's last visit to the site cannot be determined. 

> *How do we know if the CSV files have been updated since the user's last visit to the site?* We store a `lastVisitTimestamp` in localStorage and retrieve the last commit to the `data` folder from GitHub in each session (we store this as a session variable to prevent this check from happening multiple times per session). Any change to the `data` folder will trigger a refresh of the cached reports. 

#### `junk` file

We have a `junk` file in the data folder. If you need to trigger a data refresh for some reason, where the data isn't actually refreshed, but something in the logic now requires the data to be read again, you can use this file. This is a hack, and has been used in the past where the structure of the `reports` object changed in some way, but the `reports` in the user's localStorage was not updated because the `data` folder was not changed.

### Configurable Things (via Code)

#### Best/Worst Sort Colours

There are CSS rules that are dedicated to accenting the column that is currently being sorted. The column header is always accented with a different colour, however it is possible to have different colours for:
a) the name of the currently sorted column (`.sort-col-color` `.best-at-top` `best-at-bottom`) 
b) the arrow of the currently sorted column (`.sort-col-color::after` and `.sort-name-col-arrow::after`)
c) the arrow of the currently sorted column in a "rankable" column (i.e. one that has a non-null `bestScore`) based on if it is being sorted with its best value at the top or its worst value at the top (`.best-at-top::after` `best-at-bottom::after`)

> *We could consider a `settings` hash in localStorage for a number of things (e.g. a toggle for "Colour-coded Best/Worst Sorting", favourite reports, default report, page colour themes, etc.)*

#### Column Order

The order of the columns is determined by the order they appear in `validColumns.js`

#### Column Names

Columns can have a `displayName`, and if not present, the `name` is used. 

> *We are considering adding a `mobileDisplayName` (see `feature/mobile-specific-column-names`) but I don't think it's really necessary. It doesn't provide value beyond fitting maybe 1 or 2 extra columns on the screen in the mobile view.*

#### New Columns

Add a column to `validColumns.js` and it is then considered valid and can be used in a report.