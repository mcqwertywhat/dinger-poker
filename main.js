// only allowed param is 'id'; expect it to match a reports key
// TODO: should requestedReportID be set as global variable in some other way?
let requestedReportID = new URLSearchParams(window.location.search).get("id");
let reports;
let mData;
let mColumns;

const validColumns = [
  // the order of these columns is the order they will appear in the table
  { key: "_Index", name: "#", displayName: "#"},
  { key: "Name", name: "Name", displayName: "Name" },
  { key: "Buyins", name: "Buy-ins", displayName: "Games" },
  { key: "RebuysCount", name: "Rebuys" },
  { key: "TimesPlaced", name: "Times Placed", displayName: "Payouts" },
  { key: "AveragePlaced", name: "Average Placed", displayName: "Payout %", transform: transformAvgPlaced },
  { key: "First", name: "1st" },
  { key: "Second", name: "2nd" },
  { key: "Third", name: "3rd" },
  { key: "OnTheBubble", name: "Bubble" },
  { key: "Hits", name: "Hits", transform: transformHits },
  { key: "AverageHits", name: "Average Hits", displayName: "Avg Hits", transform: transformAvgHits  },
  { key: "TotalWinnings", name: "Total Winnings", displayName: "Won", transform: transformMoney },
  { key: "TotalCost", name: "Total Cost", displayName: "Cost", transform: transformMoney },
  { key: "TotalTake", name: "Total Take", displayName: "Take", transform: transformMoney },
]
.map((col, index) => ({ ...col, order: index }));

async function initializePage() {
  await loadReports();
  processQueryparams();
  await updateLocalStorageIfNecessary();
  const requestedReport = await loadAndReturnReport(requestedReportID);
  // awaiting setCurrentReport because mColumns has to be set before creating the header row
  await setCurrentReport(requestedReport);
  createHeaderRow();
  populateDropdown();
  populateInfoIcon(requestedReport);
  addEventListenerForReportSelect();
  addEventListenerForInfoIcon();
  createTableRows();
  TDSort?.init("pTable", "pColumns");
  if (sessionStorage.getItem("firstLoad") === null) {
    // load other report data in background (notice we do not await this function)
    cacheAllReportsData();
    sessionStorage.setItem("firstLoad", "true");
  }
}

function populateInfoIcon(report) {
  const isoString = report.lastUpdatedAt
  const date = new Date(isoString);

  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    weekday: 'long',
    hour: 'numeric',
    minute: '2-digit',
  };
  const localDateString = date.toLocaleString(undefined, options);
  document.getElementById("info-text").innerHTML = `<strong>${report.title}</strong> last updated on<br/> ${localDateString}`;
}

function addEventListenerForInfoIcon() {  
  document.getElementById("info-icon").addEventListener("click", () => {
    const infoText = document.getElementById("info-text");
    if (infoText.style.display === "inline-block") {
      infoText.style.display = "none";
      return;
    } else {
      infoText.style.display = "inline-block";
    }
  });
}

function addEventListenerForReportSelect() {
  document.getElementById("report-select").addEventListener("change", () => {
    requestedReportID = document.getElementById("report-select").value;
    window.location.href = `index.html?id=${requestedReportID}`;
  });
}

function processQueryparams() {
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

async function loadReports() {
  try {
    reports = localStorage.getItem('reports');
    if (!reports) {
      console.log('Fetching reports.json...');
      const response = await fetch('reports.json');
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      reports = await response.json();
      localStorage.setItem('reports', JSON.stringify(reports));
    } else {
      reports = JSON.parse(reports);
    }

    // Add `headers`, `data`, and `lastUpdatedAt` attributes to each report as we don't put them in JSON
    for (const key in reports) {
      reports[key].headers = [];
      reports[key].data = [];
      reports[key].lastUpdatedAt = undefined;
    }

    // Now you can work with the `reports` object as needed
    // For example, assign it to a global variable if necessary
    // TODO: really? assign as global variable like this?
    window.reports = reports;

  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

async function getLatestCommitTimeStampFromGitHub(path) {
  // returns a Date object, or null if error
  try {
    console.log(`Fetching timestamp for the latest commit for the path '${path}' from GitHub...`);
    // fetch only the latest commit (`per_page=1` should be the latest, according to GPT) from the main branch, for the specified folder/file
    const response = await fetch(`https://api.github.com/repos/mcqwertywhat/dinger-poker/commits?sha=main&per_page=1&path=${path}`);
    const data = await response.json();  
    latestCommitTimestamp = new Date(data[0].commit.committer.date);
    return latestCommitTimestamp;
  } catch (error) {
    console.error('Error fetching latest commit timestamp:', error);
    return null;
  }
}

async function updateLocalStorageIfNecessary() {
  // see if data folder on github has been updated since last visit; if so, 
  let latestCommitTimestamp = sessionStorage.getItem('latestCommitDataFolder');
  if (latestCommitTimestamp) {
    latestCommitTimestamp = new Date(latestCommitTimestamp);
  } else {
    latestCommitTimestamp = await getLatestCommitTimeStampFromGitHub('data');
  }

  // we use session storage for this one value
  // this also allows a user to just close the tab and reopen to get the latest data
  sessionStorage.setItem('latestCommitDataFolder', latestCommitTimestamp.toISOString());

  const lastVisitTimestamp = localStorage.getItem('lastVisitTimestamp');
  const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null;

  // TODO: Testing => I'm not absolutely sure this will allow the localStorage data to be refreshed if the commit to the repo happens on the same day. Need to try to make a commit to the data folder and see if I start a new session that  I'm in shows as fetching new data.
  if (!lastVisitDate || latestCommitTimestamp > lastVisitDate) {
    console.log('Clearing local storage...either no lastVisitDate or the latestCommit is later than the lastVisitDate');
    localStorage.clear();
    await loadReports();
    await loadAndReturnReport(requestedReportID);
    localStorage.setItem('lastVisitTimestamp', new Date().toISOString());
  }
}

async function cacheAllReportsData() {
  // this should run in the background and fetch all the data from the CSVs and store it in localStorage
  // it should only run if the data is not already in localStorage on the initial load of the page, and store an firstLoad session value to prevent it from running again
  // we know this isn't being called unnecessarily because we checked it with a setTimeout of 10 seconds in testing; we could see that reports were not loaded ahead of time
  for (let key in reports) {
    if (reports[key].headers.length > 0 && reports[key].data.length > 0) {
      console.log(`${reports[key].title} is already loaded in memory!`)
      continue;
    }
    loadAndReturnReport(key);
  }
}

async function loadAndReturnReport(key) {
  let report = reports[key];
  let cachedReport = localStorage.getItem(`${key}`);

  if (cachedReport) {
    report = JSON.parse(cachedReport);
  } else {
    console.log(`Fetching "${report.title}" report data from CSV...`)
    // Data is not available in localStorage, fetch it
    let data = await fetchCSV(`data/${report.filename}`);
    let headers = data
      .trim()
      .split("\n")[0]
      .split(",")
      .map((header) => header.trim());
    // TODO: parseCSV seems to return only the data, not the headers; it seems like it should return both in an array for what i need
    data = parseCSV(data);
    // we need to set headers explicitly because they are not defined in the reports.json file
    headers = orderHeaders(headers);
    report.headers = headers;
    report.data = data;
    report.lastUpdatedAt = await getLatestCommitTimeStampFromGitHub(`data/${report.filename}`);;

    // Store new data in localStorage
    localStorage.setItem(`${key}`, JSON.stringify(report));
  }

  return report;
}

function orderHeaders(headers) {
  const orderedHeaders = [];
  validColumns.sort((a, b) => a.order - b.order).forEach((column) => {
    if (headers.includes(column.name)) {
      orderedHeaders.push(column.name);
    }
  });

  return orderedHeaders
}

async function setCurrentReport(report) {
  // async because mData and mColumns need to be set before other things happen
  mData = report.data;
  const validHeaderNames = validColumns.map((column) => column.name);
  mColumns = report.headers
    .map((headerName) => {
      if (validHeaderNames.includes(headerName)) {
        return validColumns.find((column) => column.name === headerName);
      }
    })
    .filter((column) => column !== undefined);
}

function createHeaderRow() {
  const headerRow = document.getElementById("pColumns");

  mColumns.forEach((column) => {
    // TODO: this is a th, but originally was a td... check CSS to see if anything messes up because of it
    const th = document.createElement("th");
    th.className = `statsColumn statsColumnHeader align-${column.Align}`;
    const displayName = column.displayName ? column.displayName : column.name;
    th.textContent = displayName;
    headerRow.appendChild(th);
  });
}

function populateDropdown() {
  const reportSelect = document.getElementById("report-select");
  for (const key in reports) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = reports[key].title;
    reportSelect.appendChild(option);
  }

  reportSelect.value = requestedReportID;
}

function createTableRows() {
  tableBody = document.getElementById("pBody");

  for (let i = 0; i < mData.length; i++) {
    const tr = document.createElement("tr");
    tr.className = i % 2 === 0 ? "even" : "odd";

    mData[i].Columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = column.Text;
      td.className = `statsColumn align-${column.Align}`;
      if (column.FixedClasses) {
        td.className += ` ${column.FixedClasses}`;
      }
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  }
}

function parseCSV(csvText) {
  // TODO: look at how this works and see why it doesn't return the headers
  // Transform CSV data into a data structure that is expected based on exising JS Code
  const lines = csvText.trim().split("\n");
  const headers = lines[0].split(",");

  const processedData = lines.slice(1).map((line, index) => {
    const values = line.split(",");
    const row = headers.reduce((obj, header, i) => {
      obj[header.trim()] = values[i] ? values[i].trim() : "";
      return obj;
    }, {});

    // this is a bit hacky; we should really refactor this to have an overall better data structure that links headers to data; they are currently separate
    let sortedColumns = Object.entries(row).sort((a, b) => {
      a = validColumns.find((column) => column.name === a[0]);
      b = validColumns.find((column) => column.name === b[0]);
      return a.order - b.order;
    });

    const columns = sortedColumns.map(([key, value]) => {
      // Convert numbers to actual numbers and format accordingly      
      // it feels like data should be formatted on render (i.e. when the variable mData is set)
      // but we aren't changing the original CSV file so who cares right?
      // TODO: consider transforming on render; if we did do it where mData was set, then we'd be able to hide/show formatted/not formatted options instead of forcing them on the user 
      const numericValue = parseFloat(value.replace(/[,$]/g, ""));
      const numericColumn = validColumns.find((column) => column.name === key);
      const formattedText = numericColumn.transform ? numericColumn.transform(numericValue) : value;
      
      let fixedClasses = null;
      if (key === "#") {
        fixedClasses = 'fixed-column fixed-column-0';
      } else if (key === "Name") {
        fixedClasses = 'fixed-column fixed-column-1';
      }
      return {
        Text: formattedText,
        HTML: formattedText,
        SortValue: isNaN(numericValue) ? value.toLowerCase() : numericValue,
        Align: !isNaN(numericValue) ? "right" : "left",
        FixedClasses: fixedClasses
      };
    });

    return {
      Index: index,
      Columns: columns,
    };
  });

  return processedData;
}

function transformMoney(numericValue) {
  // do we need amount to be numeric value?
  if (numericValue < 0) {
    return `-$${Math.abs(numericValue).toFixed(0)}`;
  } else {
    return `$${numericValue.toFixed(0)}`;
  }
}

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

async function fetchCSV(url) {
  try {
    const response = await fetch(url);
    const csvText = await response.text();
    return csvText;
  } catch (error) {
    console.error("Error fetching CSV file:", error);
  }
}

// everything in TDSort was from the original HTML export
var TDSort = (function () {
  // the column index on which we are sorting
  var sortIndex = -1;
  // was the last sort a reverse sort?
  var reverseSort = false;
  // not going to try too hard for browser compatibility - just check for IE or non-IE
  var mTextKey = document.all ? "innerText" : "textContent";
  var mTableID = "";
  var mHeaderRowID = "";
  var mIndexCol = 0;

  // initialize the page
  function init(inTableID, inHeaderRowID) {
    mTableID = inTableID;
    mHeaderRowID = inHeaderRowID;
    // install an onClick handler for each column header
    var theRow = document.getElementById(mHeaderRowID);
    var getSortFn = function (inIndex) {
      return function () {
        sortByColumn(inIndex);
      };
    };

    if (theRow) {
      for (var i = 0, iLen = theRow.cells.length; i < iLen; i++) {
        if (
          i != mIndexCol &&
          mColumns[i].key != "_PlayerImage" &&
          mColumns[i].key != "_HitmanImage"
        ) {
          theRow.cells[i].onclick = getSortFn(i);
          theRow.cells[i].style.cursor = "pointer";
        }
      }
    }

    // put a reference to each row in the data, if we haven't already
    var theRows = document.getElementById(mTableID).rows;

    for (var i = 0, iLen = mData.length; i < iLen; i++) {
      mData[i].Row = theRows[i + 1];
    }
  }

  // sort fn
  function sortRow(a, b) {
    var aVal = a.Columns[sortIndex].SortValue;
    var bVal = b.Columns[sortIndex].SortValue;

    if (aVal === null || bVal === null) {
      // for equal values, fall back on the row index
      if (aVal === bVal) return a.Index - b.Index;

      return aVal === null ? -1 : 1;
    }

    if (aVal < bVal) return -1;
    else if (aVal > bVal) return 1;

    // for equal values, fall back on the row index
    return a.Index - b.Index;
  }

  function sortByColumn(inIndex) {
    if (mData.length == 0) return;

    if (inIndex == sortIndex) reverseSort = !reverseSort;
    // sorting the same column, again, so reverse the current sort
    else reverseSort = false; // if sorting on a new column, always reset to forward sort

    sortIndex = inIndex;

    var theTable = document.getElementById(mTableID);
    var theParent = theTable.rows[0].parentNode;

    // remove all rows, in current sort order (appears to be the fastest way)
    for (var i = 0, iLen = mData.length; i < iLen; i++) {
      theParent.removeChild(mData[i].Row);
    }
    // sort the rows
    mData.sort(sortRow);

    if (reverseSort) mData.reverse();

    // put the rows back in the new sorted order
    // there may or may not be an empty row followed by a sum and average rows, so for an easy solution insert the
    // rows before the header row, then pop the header row off and put it back in front of the first row
    var theHeader = theParent.rows[0];

    for (var i = 0, iLen = mData.length; i < iLen; i++) {
      // set the row's class to maintain even/odd row shading
      mData[i].Row.className = i % 2 ? "odd" : "even";
      theParent.insertBefore(mData[i].Row, theHeader);
    }

    theParent.removeChild(theHeader);
    theParent.insertBefore(theHeader, mData[0].Row);

    // update the index column
    if (mIndexCol >= 0) {
      for (var i = 0, iLen = mData.length; i < iLen; i++)
        mData[i].Row.cells[mIndexCol][mTextKey] = "" + (i + 1);
    }
  }

  return {
    init: init,
  };
})();

window.onload = initializePage;
