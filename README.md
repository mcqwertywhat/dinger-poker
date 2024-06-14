# Dinger Poker

_A place to post poker stats from Dinger Poker games._

---

This site lists a number of stats pages (i.e. reports) from Dinger Poker games. Each report is a different query (a particular year, all time, type of game, etc.)

---

## Quick Start

**Add a new report** to the site:

1. Add a CSV file to the `data` folder.
2. Add an entry in the `_reports.json` file with a filename that matches the CSV file you added.

That's it! The new report should appear on the site.

---

## Details on adding a new report 

### Adding the CSV file

The column names should be the first line of the CSV file, and we expect a file that only uses these column names. The names can be in any order.

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

### Adding an entry to `_reports.json`

A report needs an ID, a `title` and a `filename`. It also has to be structured with `{ }` around the `title` and `filename`, and all the things you enter should have `"` around them. 

Here's an example of adding a report entry with the id `pineapples`:

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

The `"title"` is text that will appear on the site (displayed as the link to the report and as the heading for the report).

The **ID** for the report in the example above is `pineapples`. **It should be unique from all other IDs.** Use only letters, numbers, underscores, and dashes for the ID and also for the `filename`. (_Other characters might work....but sticking with these will definitely work._)

**Do not** change the name of the `_reports.json` file or the name of the `data` folder

### Replace an existing report

If you want to refresh the data from a report, you just need to replace its CSV file in the `data` folder. The filename should stay the same.


