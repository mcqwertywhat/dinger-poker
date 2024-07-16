import {
  loadReports,
  loadAndReturnReport,
  cacheAllReportsData,
  updateLocalStorageIfNecessary,
} from "./dataUtils.js";

import {
  addEventListenerForReportSelect,
  addEventListenerForInfoIcon,
} from "./eventListeners.js";

import {
  createHeaderRow,
  createTableRows,
  populateDropdown,
  populateInfoIcon,
} from "./domUtils.js";

import { TDSort } from "./sortingMethods.js";

async function initializePage() {
  // order matters; each function relies on the previous one and we need to set some global variables for use by other functions
  const reports = await loadReports();
  window.reports = reports;
  
  const requestedReportID = getRequestedReportID();
  await updateLocalStorageIfNecessary(requestedReportID);
  const requestedReport = await loadAndReturnReport(requestedReportID);
  const mData = requestedReport.data;
  const mColumns = requestedReport.headers;
  window.mData = mData;
  window.mColumns = mColumns;

  createHeaderRow(mColumns);
  populateDropdown(requestedReportID);
  populateInfoIcon(requestedReport);
  addEventListenerForReportSelect();
  addEventListenerForInfoIcon();
  createTableRows(mData);
  TDSort.init("p-table", "p-columns", mColumns, mData);
  if (sessionStorage.getItem("firstLoad") === null) {
    // load other report data in background
    cacheAllReportsData();
    sessionStorage.setItem("firstLoad", "true");
  }
}

function getRequestedReportID() {
  // only allowed param is 'id'; expect it to match a reports key
  let requestedReportID = new URLSearchParams(window.location.search).get("id");
  if (!requestedReportID || !Object.keys(reports).includes(requestedReportID)) {
    requestedReportID = Object.keys(reports).find(key => reports[key].default) || Object.keys(reports)[0];
  }
  return requestedReportID
}

window.onload = initializePage;
