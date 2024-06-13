const DB = {
  // at the moment, we expect the query param to be the key of the object
  // think of this DB as a list of reports
  // if we want to add more CSV files, we just add a new key-value pair to this object
  "2024":            { title: "2024", filename: "2024.csv", data: [] },
  "2023":            { title: "2023", filename: "2023.csv", data: [] },
  "2022":            { title: "2022", filename: "2022.csv", data: [] },
  "2021":            { title: "2021", filename: "2021.csv", data: [] },
  "2020":            { title: "2020", filename: "2020.csv", data: [] },
  "2019":            { title: "2019", filename: "2019.csv", data: [] },
  "christmas":       { title: "Christmas Poker", filename: "christmas.csv", data: [] },
  "dinger_days":     { title: "Dinger Days", filename: "dinger_days.csv", data: [] },
  "bounty":          { title: "Bounty", filename: "bounty.csv", data: [] },
  "hold_em_rebuy":   { title: "Hold'em Rebuy", filename: "hold_em_rebuy.csv", data: [] },
  "sundays":         { title: "Sundays", filename: "sundays.csv", data: [] },
  "all_time":        { title: "All Time", filename: "all_time.csv", data: [] }
}

const mColumns = [
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
function createHeaderRow() {
  const headerRow = document.getElementById("pColumns");

  mColumns.forEach((column) => {
    // TODO: this is a th, but originally was a td... but should be th for semantic reasons yeah?
    const th = document.createElement("th");
    th.className = `statsColumn statsColumnHeader align-${column.Align}`;
    th.textContent = column.Name;
    headerRow.appendChild(th);
  });
}

const queryString = window.location.search;
const searchParams = new URLSearchParams(queryString);
// only allowed param is 'q' and we expect that it matches a DB key
const query = searchParams.get('q');
const validQueryParams = Object.keys(DB);
if (!query || !validQueryParams.includes(query)) {
  // default to 2024 if no query param is provided
  window.location.href = 'index.html?q=2024';
}

async function initializePage() {
  await setData();
  createHeaderRow();
  updateQueryHeading();
  createTableHeaderLinks()
  createTableRows();
  TDSort?.init('pTable', 'pColumns');
}

async function setData() {
  // grab data for each csv file
  // TODO: we should use Promise.all to fetch all the data at once
  for (let key in DB) {
    let report = DB[key];
    let cachedData = localStorage.getItem(`${key}`);
    
    if (cachedData) {
      // Data is available in localStorage
      report.data = JSON.parse(cachedData);
      console.log(`${key} data loaded from localStorage.`);
    } else {
      // Data is not available in localStorage, fetch it
      let data = await fetchCSV(`data/${report.filename}`);
      data = parseCSV(data);
      localStorage.setItem(`${key}`, JSON.stringify(data)); // Store data as JSON string
      console.log(`${key} data cached in localStorage.`);
      report.data = data;
    }
  }

  mData = DB[query].data;
}

function parseCSV(csvText) {
  // Transform CSV data into a data structure that is expected based on exising JS Code
  const lines = csvText.trim().split('\n');
  const headers = lines[0].split(',');

  const processedData = lines.slice(1).map((line, index) => {
    const values = line.split(',');
    const row = headers.reduce((obj, header, i) => {
      obj[header.trim()] = values[i] ? values[i].trim() : '';
      return obj;
    }, {});

    const columns = Object.entries(row).map(([key, value]) => {
      // Convert numbers to actual numbers and format accordingly
      const numericValue = parseFloat(value.replace(/[,$]/g, ''));
      return {
        Text: value,
        HTML: value,
        SortValue: isNaN(numericValue) ? value.toLowerCase() : numericValue,
        Align: !isNaN(numericValue) ? "right" : "left"
      };
    });

    return {
      Index: index,
      Columns: columns
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
    console.error('Error fetching CSV file:', error);
  }
}

function createTableHeaderLinks() {
  const tableHeader = document.getElementById("tHeader");
  const navMenu = document.createElement("div");
  tableHeader.appendChild(navMenu);
  navMenu.className = "description";

  const keys = Object.keys(DB);
  const lastKey = keys[keys.length - 1];

  keys.forEach((key) => {
    const report = DB[key];
    const link = document.createElement("a");
    link.href = `index.html?q=${key}`;
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

function updateQueryHeading() {
  const reportTitle = document.getElementById("report-title");
  // TODO: consolidate this logic with the getData function; 
  reportTitle.textContent = DB[query].title;
}

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

    if (inIndex == sortIndex)
      reverseSort =
        !reverseSort; // sorting the same column, again, so reverse the current sort
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