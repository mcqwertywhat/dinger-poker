import {
  setCurrentReport,
  loadAndReturnReport,
} from "./dataUtils.js";

import {
  createHeaderRow,
  createTableRows,
  populateInfoIcon,
} from "./domUtils.js";

import { TDSort } from "./sortingMethods.js";

export function addEventListenerForInfoIcon() {
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

export function addEventListenerForReportSelect() {
  document.getElementById("report-select").addEventListener("change", async (e) => {
    const requestedReportID = e.target.value
    document.getElementById("p-columns").innerHTML = "";
    const tBody = document.getElementById("p-table-body")
    
    // clear table of current data
    while (tBody.childNodes.length > 2) {
      tBody.removeChild(tBody.lastChild)
    }
    
    const requestedReport = await loadAndReturnReport(requestedReportID);
    await setCurrentReport(requestedReport);

    window.mData = requestedReport.data;
    window.mColumns = requestedReport.headers;

    createHeaderRow(mColumns);
    populateInfoIcon(requestedReport);
    createTableRows(mData);

    // TODO: the init method probably does too much stuff after the page has already been loaded. need something lighter weight that does not reinstall event handlers for clicking columns
    TDSort.init("p-table", "p-columns", mColumns, mData);
  });
}
