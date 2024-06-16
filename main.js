// only allowed param is 'id'; expect it to match a reports key
// TODO: should requestedReportID be set as global variable in some other way?
const requestedReportID = new URLSearchParams(window.location.search).get("id");
let reports;
let mData;
let mColumns;

const validColumns = [
  { Key: "_Index", Name: "#" },
  { Key: "Name", Name: "Name" },
  { Key: "Buyins", Name: "Buy-ins" },
  { Key: "RebuysCount", Name: "Rebuys" },
  { Key: "Hits", Name: "Hits" },
  { Key: "TotalWinnings", Name: "Total Winnings" },
  { Key: "TotalCost", Name: "Total Cost" },
  { Key: "TotalTake", Name: "Total Take" },
  { Key: "TimesPlaced", Name: "Times Placed" },
  { Key: "First", Name: "1st" },
  { Key: "Second", Name: "2nd" },
  { Key: "Third", Name: "3rd" },
  { Key: "AveragePlaced", Name: "Average Placed" },
  { Key: "OnTheBubble", Name: "Bubble" },
  { Key: "AverageHits", Name: "Average Hits" },
];

async function initializePage() {
  await loadReports();
  processQueryparams();
  await checkAndUpdateIfNecessary();
  const requestedReport = await loadReportData(requestedReportID);
  // awaiting setCurrentReport because mColumns has to be set before creating the header row
  await setCurrentReport(requestedReport);
  createHeaderRow();
  updateReportTitle();
  createTableHeaderLinks();
  createTableRows();
  TDSort?.init("pTable", "pColumns");
  if (sessionStorage.getItem("firstLoad") === null) {
    // load other report data in background (notice we do not await this function)
    cacheAllReportsData();
    sessionStorage.setItem("firstLoad", "true");
  }
}

function processQueryparams() {
  const validQueryParams = Object.keys(reports);
  if (!requestedReportID || !validQueryParams.includes(requestedReportID)) {
    // default to 2024 if no valid report key is provided
    window.location.href = "index.html?id=2024";
  }
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

    // Add `headers` and `data` attributes to each report as we don't put them in JSON
    for (const key in reports) {
      reports[key].headers = [];
      reports[key].data = [];
    }

    // Now you can work with the `reports` object as needed
    // For example, assign it to a global variable if necessary
    // TODO: really? assign as global variable like this?
    window.reports = reports;

  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

async function getLatestCommitTimeStamp() {
  // fetches the latest timestamp for the last GitHub commit from session storage if it exists, or from GitHub if it doesn't
  // returns a Date object, or null if error
  let latestCommitTimestamp = sessionStorage.getItem('latestCommitTimestamp');
  
  if (latestCommitTimestamp) {
    return new Date(latestCommitTimestamp);
  } else {
    try {
      console.log('Fetching timestamp for the latest commit to the `data` folder from GitHub...');
      // fetch only the latest commit (`per_page=1` should be the latest, according to GPT) from the main branch, for the data folder
      const response = await fetch(`https://api.github.com/repos/mcqwertywhat/dinger-poker/commits/main?path=data&per_page=1`);
      const data = await response.json();    
      latestCommitTimestamp = new Date(data.commit.committer.date);
      return latestCommitTimestamp;
    } catch (error) {
      console.error('Error fetching latest commit timestamp:', error);
      return null;
    }
  }
}

async function checkAndUpdateIfNecessary() {
  // latestCommitTimestamp should be a Date object
  const latestCommitTimestamp = await getLatestCommitTimeStamp();
  if (!latestCommitTimestamp) {
    console.error('Could not get latest commit timestamp.');
    return;
  }
  // we use session storage for this one value, but local storage for others because we want to check for updates on each session
  // this also allows a user to just close the tab and reopen to get the latest data
  sessionStorage.setItem('latestCommitTimestamp', latestCommitTimestamp.toISOString());

  const lastVisitTimestamp = localStorage.getItem('lastVisitTimestamp');
  const lastVisitDate = lastVisitTimestamp ? new Date(lastVisitTimestamp) : null;

  // TODO: Testing => I'm not absolutely sure this will allow the localStorage data to be refreshed if the commit to the repo happens on the same day. Need to try to make a commit to the data folder and see if I start a new session that  I'm in shows as fetching new data.
  if (!lastVisitDate || latestCommitTimestamp > lastVisitDate) {
    console.log('Clearing local storage...either no lastVisitDate or the latestCommit is later than the lastVisitDate');
    localStorage.clear();
    await loadReports();
    await loadReportData(requestedReportID);
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
    loadReportData(key);
  }
}

async function loadReportData(key) {
  let report = reports[key];
  let cachedReport = localStorage.getItem(`${key}`);

  if (cachedReport) {
    report = JSON.parse(cachedReport);
  } else {
    console.log(`Fetching report "${report.title}" data from CSV...`)
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
    report.headers = headers;
    report.data = data;

    // Store new data in localStorage
    localStorage.setItem(`${key}`, JSON.stringify({
      headers: report.headers,
      data: report.data
    }));
  }

  return report;
}

async function setCurrentReport(report) {
  // async because mData and mColumns need to be set before other things happen
  mData = report.data;
  const validHeaderNames = validColumns.map((column) => column.Name);
  mColumns = report.headers
    .map((headerName) => {
      if (validHeaderNames.includes(headerName)) {
        return validColumns.find((column) => column.Name === headerName);
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
    th.textContent = column.Name;
    headerRow.appendChild(th);
  });
}

function updateReportTitle() {
  const reportTitle = document.getElementById("report-title");
  // TODO: consolidate this logic with the getData function;
  reportTitle.textContent = reports[requestedReportID].title;
}

function createTableHeaderLinks() {
  const tableHeader = document.getElementById("tHeader");
  const navMenu = document.createElement("div");
  tableHeader.appendChild(navMenu);
  navMenu.className = "description";

  const keys = Object.keys(reports);
  const lastKey = keys[keys.length - 1];

  keys.forEach((key) => {
    const report = reports[key];
    const link = document.createElement("a");
    link.href = `index.html?id=${key}`;
    link.textContent = report.title;
    navMenu.appendChild(link);

    // no pipe after last link
    if (key !== lastKey) {
      navMenu.appendChild(document.createTextNode(" | "));
    }
  });
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

    const columns = Object.entries(row).map(([key, value]) => {
      // Convert numbers to actual numbers and format accordingly
      const numericValue = parseFloat(value.replace(/[,$]/g, ""));
      return {
        Text: value,
        HTML: value,
        SortValue: isNaN(numericValue) ? value.toLowerCase() : numericValue,
        Align: !isNaN(numericValue) ? "right" : "left",
      };
    });

    return {
      Index: index,
      Columns: columns,
    };
  });

  return processedData;
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
          mColumns[i].Key != "_PlayerImage" &&
          mColumns[i].Key != "_HitmanImage"
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
