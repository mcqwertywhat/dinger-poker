import { validColumns } from "./validColumns.js";

// everything in TDSort was from the original HTML export

export const TDSort = (function () {
    // the column index on which we are sorting
    var sortIndex = -1;
    var sortedHighToLow = true;
    // TODO: add different mTextKey for older browsers (keep in mind we load HTML and plain text into this)
    var mTextKey = "innerHTML";
    var mTableID = "";
    var mHeaderRowID = "";
    var mIndexCol = 0;
  
    // initialize the page
    function init(inTableID, inHeaderRowID, mColumns, mData) {
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
            // this installs an onclick handler for each row 
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
  
      const defaultColumnIndex = validColumns.findIndex(
        (column) => column.sortOnPageLoad
      );
      sortByColumn(window.inIndex || defaultColumnIndex);
    }
  
    // sort fn
    function sortRow(a, b) {
      var aVal = a.columns[sortIndex].sortValue;
      var bVal = b.columns[sortIndex].sortValue;
  
      if (aVal === null || bVal === null) {
        // for equal values, fall back on the row index
        if (aVal === bVal) return a.index - b.index;
  
        return aVal === null ? -1 : 1;
      }
  
      if (aVal < bVal) return -1;
      else if (aVal > bVal) return 1;
  
      // for equal values, fall back on the row index
      return a.index - b.index;
    }
  
    function sortByColumn(inIndex) {
      window.inIndex = inIndex
      if (mData.length == 0) {
        return;
      }
  
      // sortIndex is -1 if we haven't sorted yet; only changes after the first sort
      if (sortIndex >= 0) {
        const lastSortedColumn = document.querySelector(
          `#p-columns th:nth-of-type(${sortIndex + 1})`
        );
        lastSortedColumn.classList.remove(
          "sort-col-arrow",
          "sort-col-desc",
          "sort-col-asc",
          "sort-name-col-arrow",
          "best-at-top",
          "best-at-bottom",
          "sort-col-color"
        );
        const trophyIcons = document.querySelectorAll("i.fa-trophy");
        trophyIcons.forEach((icon) => {
          icon.remove();
        });
      }
  
      const currentColElement = document.querySelector(
        `#p-columns th:nth-of-type(${inIndex + 1})`
      );      
      
      if (window.onSameReport) {
        if (inIndex == sortIndex) {
          // sorting the same column while on the same report, so just reverse the current sort
          sortedHighToLow = !sortedHighToLow;
        } else if (mColumns[inIndex].defaultSort === "asc") {
          // an 'ascending' column has been clicked where it was not being sorted on before
          // some columns are sorted low to high by default (e.g. "Name" default sort is A->Z)
          sortedHighToLow = false;
        } else {
          sortedHighToLow = true;
        }
      }

      window.onSameReport = true;
      
      sortIndex = inIndex;
      const currentColumn = mColumns[inIndex];
      // the name column is always leftmost and needs its sort arrow repositioned
      const classesToAdd =
        currentColumn.key == "Name"
          ? ["sort-name-col-arrow"]
          : ["sort-col-arrow"];
      classesToAdd.push("sort-col-color");
      // we can use arrows that imply "best" and "worst" if the column is rankable (i.e. it has a non-null bestScore) otherwise, we can use a neutral colour for the arrow
      // all columns currently use the same color for sort arrows, and if not leveraging that, then none of this needs to be here
      if (currentColumn.bestScore) {
        const sortClass =
          currentColumn.bestScore === "high"
            ? sortedHighToLow
              ? "best-at-top"
              : "best-at-bottom"
            : sortedHighToLow
            ? "best-at-bottom"
            : "best-at-top";
        classesToAdd.push(sortClass);
      }
  
      classesToAdd.push(sortedHighToLow ? "sort-col-desc" : "sort-col-asc");
  
      currentColElement.classList.add(...classesToAdd);
  
      var theTable = document.getElementById(mTableID);
      var theParent = theTable.rows[0].parentNode;
  
      // remove all rows, in current sort order (appears to be the fastest way)
      for (var i = 0, iLen = mData.length; i < iLen; i++) {
        theParent.removeChild(mData[i].Row);
      }
      // sort the rows
      mData.sort(sortRow);
  
      if (sortedHighToLow) {
        mData.reverse();
      }
  
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
  
      // TODO: we're reversing twice in a row? Must be a better way.
      if (!sortedHighToLow) {
        mData.reverse();
      }
  
      if (
        currentColumn?.bestScore === "low" ||
        (currentColumn?.bestScore === null && currentColumn.defaultSort === "asc")
      ) {
        // without this, the rank column will be sorted opposite of the "best" result
        mData.reverse();
      }
  
      if (currentColumn.bestScore) {
        // update the index column
        const ranks = [];
        if (mIndexCol >= 0) {
          let currentDataValue = undefined;
          let lastDataValue = undefined;
          let currentRank = 1;
          for (var i = 0, iLen = mData.length; i < iLen; i++) {
            // this will allow us to identify ties
            currentDataValue = mData[i].Row.cells[sortIndex][mTextKey];
            if (typeof currentDataValue === "string") {
              if (currentDataValue.includes("$")) {
                currentDataValue = parseFloat(currentDataValue.replace("$", ""));
              } else if (currentDataValue.includes("%")) {
                currentDataValue =
                  parseFloat(currentDataValue.replace("%", "")) / 100;
              }
            }
  
            if (lastDataValue === undefined) {
              lastDataValue = currentDataValue;
            }
  
            if (lastDataValue != currentDataValue) {
              currentRank = currentRank + 1;
            }
  
            lastDataValue = currentDataValue;
            ranks.push(currentRank);
          }
        }
  
        for (var i = 0, iLen = mData.length; i < iLen; i++) {
          mData[i].Row.cells[mIndexCol][mTextKey] = getPlaceSuffix(ranks[i]);
        }
      } else {
        // clear the index column as the column isn't rankable
        for (var i = 0, iLen = mData.length; i < iLen; i++) {
          mData[i].Row.cells[mIndexCol][mTextKey] = "-";
        }
      }
    }
  
    function getPlaceSuffix(number) {
      if (number % 100 >= 11 && number % 100 <= 13) {
        return `${number}<span class='nth-place'></span>`;
      }


      if (number === 1) {
        return `<div class="rank-box"><div>${number}<span class='first-place'></span></div><i class='fa-solid fa-trophy first-place-icon'></i></div>`;
      }
  
      if (number === 2) {
        return `<div class="rank-box"><div>${number}<span class='second-place'></span></div><i class='fa-solid fa-trophy second-place-icon'></i></div>`;
      }
  
      if (number === 3) {
        return `<div class="rank-box"><div>${number}<span class='third-place'></span></div><i class='fa-solid fa-trophy third-place-icon'></i></div>`;
      }
  

      switch (number % 10) {
        case 1:
          return `${number}<span class='first-place'></span>`;
        case 2:
          return `${number}<span class='second-place'></span>`;
        case 3:
          return `${number}<span class='third-place'></span>`;
        default:
          return `${number}<span class='nth-place'></span>`;
      }
    }
  
    return {
      init: init,
    };
  })();