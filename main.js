const queryString = window.location.search;
const searchParams = new URLSearchParams(queryString);
// only allowed param is time 'period'; if this changes, update this code
const period = searchParams.get('period') || '2024';

const dataSetsV2 = {
  "2024":     { Period: "2024", Name: "2024", filename: "2024.csv", dataSet: [] },
  "all_time": { Period: "all_time", Name: "All Time", filename: "all_time.csv", dataSet: [] }
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

async function initializePage() {
  console.log('initializing page')
  await setData();
  updateQueryHeading();
  createTableHeaderLinks()
  createTableRows();
  TDSort?.init('pTable', 'pColumns');
}

async function setData() {
  // grab data for each csv file
  for (let dSet of Object.values(dataSetsV2)) {
    let data = await fetchCSV(`data/${dSet.filename}`);
    data = parseCSV(data);
    dSet.dataSet = data
  }

  mData = dataSetsV2[period].dataSet;
}

function parseCSV(csvText) {
  // Transform CSV data into a data structure that is expected based on exising JS Code
  // TODO: See if we really need Papa.parse. Might be overkill and would rather keep as lightweight as possible.
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
  // TODO: make sure circular references are not created 
  const tableHeader = document.getElementById("tHeader");
  const navMenu = document.createElement("div");
  tableHeader.appendChild(navMenu);
  navMenu.className = "description";

  const values = Object.values(dataSetsV2);
  const lastElement = values[values.length - 1];

  for (let dataSet of values) {
    const link = document.createElement("a");
    link.href = `index.html?period=${dataSet.Period}`;
    link.textContent = `${dataSet.Name}`
    navMenu.appendChild(link);
    if (dataSet != lastElement) { 
      navMenu.appendChild(document.createTextNode(" | "));
    }    
  }
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
  const querySpan = document.getElementById("query");
  // TODO: consolidate this logic with the getData function; 
  querySpan.textContent = dataSetsV2[period].Name;
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