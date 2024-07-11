import {
  setCurrentReport,
  loadAndReturnReport,
} from "./dataUtils.js";

import {
  createHeaderRow,
  createTableRows,
  populateDropdown,
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
    while (tBody.childNodes.length > 2) {
      tBody.removeChild(tBody.lastChild)
    }

    const requestedReport = await loadAndReturnReport(requestedReportID);
    const currentReport = await setCurrentReport(requestedReport);
    const mData = currentReport.data;
    const mColumns = currentReport.headers;
    window.mData = mData;
    window.mColumns = mColumns;

    createHeaderRow(mColumns);
    populateDropdown(requestedReportID);
    populateInfoIcon(currentReport);
    addEventListenerForReportSelect();
    addEventListenerForInfoIcon();
    createTableRows(mData);
    TDSort.init("p-table", "p-columns", mColumns, mData);
  });
}
