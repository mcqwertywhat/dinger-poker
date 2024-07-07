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

// other helpers

function populateInfoIcon(report) {
  const isoString = report.lastUpdatedAt;
  const date = new Date(isoString);

  const options = {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "long",
    hour: "numeric",
    minute: "2-digit",
  };
  const localDateString = date.toLocaleString(undefined, options);
  document.getElementById(
    "info-text"
  ).innerHTML = `<strong>${report.title}</strong> last updated on<br/> ${localDateString}`;
}
