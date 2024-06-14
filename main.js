// only allowed param is 'id'; expect it to match a reports key
const requestedReportID = new URLSearchParams(window.location.search).get("id");
let reports;

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
  await setData();
  createHeaderRow();
  updateReportTitle();
  createTableHeaderLinks();
  createTableRows();
  TDSort?.init("pTable", "pColumns");
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
    // Fetch the JSON file
    const response = await fetch('reports.json');
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    // Parse the JSON data
    reports = await response.json();

    // Add `headers` and `data` attributes to each report
    for (const key in reports) {
      if (reports.hasOwnProperty(key)) {
        reports[key].headers = [];
        reports[key].data = [];
      }
    }

    // Now you can work with the `reports` object as needed
    // TODO: really? assign as global variable like this?
    // For example, assign it to a global variable if necessary
    window.reports = reports;

  } catch (error) {
    console.error('Error loading reports:', error);
  }
}

async function setData() {
  const hardcodedVersion = 1; // Example: Hardcoded version number

  // Loop through each report
  for (let key in reports) {
    let report = reports[key];
    let cachedData = localStorage.getItem(`${key}`);

    if (cachedData) {
      // Data is available in localStorage
      let parsedData = JSON.parse(cachedData);

      // Check if the cached version matches the hardcoded version
      if (parsedData.version === hardcodedVersion) {
        // Use cached data
        report.headers = parsedData.headers;
        report.data = parsedData.data;
      } else {
        // Cached version does not match, fetch new data
        let data = await fetchCSV(`data/${report.filename}`);
        headers = data
          .trim()
          .split("\n")[0]
          .split(",")
          .map((header) => header.trim());
        // TODO: parseCSV seems to return only the data, not the headers; it seems like it should return both in an array for what i need
        data = parseCSV(data);
        report.headers = headers;
        report.data = data;

        // Update and store new data in localStorage with version number
        localStorage.setItem(`${key}`, JSON.stringify({
          version: hardcodedVersion,
          headers: report.headers,
          data: report.data
        }));
      }
    } else {
      // Data is not available in localStorage, fetch it
      let data = await fetchCSV(`data/${report.filename}`);
      headers = data
        .trim()
        .split("\n")[0]
        .split(",")
        .map((header) => header.trim());
      // TODO: parseCSV seems to return only the data, not the headers; it seems like it should return both in an array for what i need
      data = parseCSV(data);
      report.headers = headers;
      report.data = data;

      // Store new data in localStorage with version number
      localStorage.setItem(`${key}`, JSON.stringify({
        version: hardcodedVersion,
        headers: report.headers,
        data: report.data
      }));
    }
  }

  // Now continue with the rest of your logic
  mData = reports[requestedReportID].data;
  const validHeaderNames = validColumns.map((column) => column.Name);
  mColumns = reports[requestedReportID].headers
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
