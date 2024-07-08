export function processQueryparams(requestedReportID) {
  const validQueryParams = Object.keys(reports);
  if (!requestedReportID || !validQueryParams.includes(requestedReportID)) {
    requestedReportID = getDefaultReportID();
    window.location.href = `index.html?id=${requestedReportID}`;
  }
}

function getDefaultReportID() {  
  for (const key in reports) {
    if (reports[key].default) {
      return key;
    }
  }  
  // if no report is set to default, use the first report in the list
  return Object.keys(reports)[0];
}

export function populateInfoIcon(report) {
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
