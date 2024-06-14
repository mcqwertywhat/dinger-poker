# Dinger Poker

_A place to post poker stats from Dinger Poker games._

To add a new report to the site:

1. Add an entry in the `_reports.json` file.
2. Put a CSV file in the data folder that matches the filename you specified in the `_reports.json` file.

That's it!

## Detailed Instructions 

### Adding an entry

Here's an example of adding a report entry:

```json
{
  "2024": {
    "title": "2024",
    "filename": "2024.csv"
  },
  "pineapples": {
    "title": "When We Play for Pineapples",
    "filename": "pineapple_poker.csv"
  },
}
```

> Note the `"title"` is displayed as the link to the new report and as the heading for the report.


### CSV File

We expect a file that only uses these 15 column names:

- #
- 1st
- 2nd
- 3rd
- Average Hits
- Average Placed
- Bubble
- Buy-ins
- Hits
- Name
- Rebuys
- Times Placed
- Total Cost
- Total Take
- Total Winnings

**:warning: Do not** change the name of the `_reports.json` file or the name of the `data` folder

## Stale Data if updating an existing file
