export const validColumns =
  // the order of these columns is the order they will appear in the table
  // TODO: right now, we assume that if no bestScore is set, the rank column should not be populated with place numbers. We may want an explicit "showRank" property to determine if the rank column should be shown.
  [
    {
      key: "_Index",
      name: "#",
      displayName: " ",
      align: "left",
      defaultSort: null,
      bestScore: null,
    },
    {
      key: "Name",
      name: "Name",
      displayName: "Name",
      align: "left",
      defaultSort: "asc",
      bestScore: null,
      minWidth: 7
    },
    {
      key: "Buyins",
      name: "Buy-ins",
      displayName: "Games",
      align: "center",
      defaultSort: "desc",
      bestScore: null,
    },
    {
      key: "RebuysCount",
      name: "Rebuys",
      align: "center",
      defaultSort: "desc",
      bestScore: null,
    },
    {
      key: "TotalWinnings",
      name: "Total Winnings",
      displayName: "Won",
      align: "right",
      defaultSort: "desc",
      bestScore: "high",
      transform: transformMoney,
      minWidth: 5
    },
    {
      key: "TotalCost",
      name: "Total Cost",
      displayName: "Cost",
      align: "right",
      defaultSort: "desc",
      bestScore: null,
      transform: transformMoney,
      minWidth: 5
    },
    {
      key: "TotalTake",
      name: "Total Take",
      displayName: "Take",
      align: "right",
      defaultSort: "desc",
      bestScore: "high",
      transform: transformMoney,
      minWidth: 5,
      sortOnPageLoad: true
    },
    {
      key: "TimesPlaced",
      name: "Times Placed",
      displayName: "Payouts",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
    },
    {
      key: "AveragePlaced",
      name: "Average Placed",
      displayName: "Payout %",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
      transform: transformAvgPlaced,
    },
    {
      key: "First",
      name: "1st",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
    },
    {
      key: "Second",
      name: "2nd",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
    },
    {
      key: "Third",
      name: "3rd",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
    },
    {
      key: "OnTheBubble",
      name: "Bubble",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
    },
    {
      key: "Hits",
      name: "Hits",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
      transform: transformHits,
    },
    {
      key: "AverageHits",
      name: "Average Hits",
      displayName: "Avg Hits",
      align: "center",
      defaultSort: "desc",
      bestScore: "high",
      transform: transformAvgHits,
    },
    {
      key: "AveragePoints",
      name: "Average Points",
      displayName: "Avg Pts",
      align: "right",
      defaultSort: "desc",
      bestScore: "high"
    },
    {
      key: "Points",
      name: "Points",
      displayName: "Points",
      align: "right",
      defaultSort: "desc",
      bestScore: "high"
    }
  ].map((col, index) => ({ ...col, order: index }));

// transform functions are used to format data in the table (e.g. currency, percentages, etc.)

function transformAvgPlaced(numericValue) {
  return (numericValue * 100).toFixed(0) + "%";
}

function transformAvgHits(numericValue) {
  numericValue = Math.round(numericValue * 10) / 10;
  if (Number.isInteger(numericValue) && numericValue % 1 === 0) {
    numericValue = numericValue.toFixed(1);
  }
  return numericValue;
}

function transformHits(numericValue) {
  return Math.floor(numericValue);
}

function transformMoney(numericValue) {
  // do we need amount to be numeric value?
  if (numericValue < 0) {
    return `-$${Math.abs(numericValue).toFixed(0)}`;
  } else {
    return `$${numericValue.toFixed(0)}`;
  }
}