import { validColumns } from "./validColumns.js";

export async function loadReports() {
  try {
    let reports = localStorage.getItem("reports");
    if (!reports) {
      console.log("Fetching reports.json...");
      const response = await fetch("reports.json");
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      reports = await response.json();
      localStorage.setItem("reports", JSON.stringify(reports));
    } else {
      reports = JSON.parse(reports);
    }

    // Add `headers`, `data`, and `lastUpdatedAt` attributes to each report as we don't put them in JSON
    for (const key in reports) {
      reports[key].headers = [];
      reports[key].data = [];
      reports[key].lastUpdatedAt = undefined;
    }

    return reports;
  } catch (error) {
    console.error("Error loading reports:", error);
  }
}

export async function getLatestCommitTimeStampFromGitHub(path) {
  // returns a Date object, or null if error
  try {
    console.log(
      `Fetching timestamp for the latest commit for the path '${path}' from GitHub...`
    );
    // fetch only the latest commit (`per_page=1` should be the latest, according to GPT) from the main branch, for the specified folder/file
    const response = await fetch(
      `https://api.github.com/repos/mcqwertywhat/dinger-poker/commits?sha=main&per_page=1&path=${path}`
    );
    const data = await response.json();
    return new Date(data[0].commit.committer.date);
  } catch (error) {
    console.error("Error fetching latest commit timestamp:", error);
    return null;
  }
}

export async function updateLocalStorageIfNecessary(requestedReportID) {
  // see if data folder on github has been updated since last visit; if so,
  let latestCommitTimestamp = sessionStorage.getItem("latestCommitDataFolder");
  if (latestCommitTimestamp) {
    latestCommitTimestamp = new Date(latestCommitTimestamp);
  } else {
    latestCommitTimestamp = await getLatestCommitTimeStampFromGitHub("data");
  }

  // we use session storage for this one value
  // this also allows a user to just close the tab and reopen to get the latest data
  sessionStorage.setItem(
    "latestCommitDataFolder",
    latestCommitTimestamp.toISOString()
  );

  const lastVisitTimestamp = localStorage.getItem("lastVisitTimestamp");
  const lastVisitDate = lastVisitTimestamp
    ? new Date(lastVisitTimestamp)
    : null;

  // TODO: Testing => I'm not absolutely sure this will allow the localStorage data to be refreshed if the commit to the repo happens on the same day. Need to try to make a commit to the data folder and see if I start a new session that  I'm in shows as fetching new data.
  if (!lastVisitDate || latestCommitTimestamp > lastVisitDate) {
    console.log(
      "Clearing local storage...either no lastVisitDate or the latestCommit is later than the lastVisitDate"
    );
    localStorage.clear();
    await loadReports();
    await loadAndReturnReport(requestedReportID);
    localStorage.setItem("lastVisitTimestamp", new Date().toISOString());
  }
}

export async function cacheAllReportsData() {
  // this should run in the background and fetch all the data from the CSVs and store it in localStorage
  // it should only run if the data is not already in localStorage on the initial load of the page, and store an firstLoad session value to prevent it from running again
  // we know this isn't being called unnecessarily because we checked it with a setTimeout of 10 seconds in testing; we could see that reports were not loaded ahead of time
  for (let key in reports) {
    if (reports[key].headers.length > 0 && reports[key].data.length > 0) {
      console.log(`${reports[key].title} is already loaded in memory!`);
      continue;
    }
    loadAndReturnReport(key);
  }
}

export async function loadAndReturnReport(key) {
  let report = reports[key];
  let cachedReport = localStorage.getItem(`${key}`);

  if (cachedReport) {
    report = JSON.parse(cachedReport);
  } else {
    console.log(`Fetching "${report.title}" report data from CSV...`);
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
    report.lastUpdatedAt = await getLatestCommitTimeStampFromGitHub(
      `data/${report.filename}`
    );

    // Store new data in localStorage
    localStorage.setItem(`${key}`, JSON.stringify(report));
  }

  await setHeadersForReport(report)

  return report;
}

function orderHeaders(headers) {
  const orderedHeaders = [];
  validColumns
    .sort((a, b) => a.order - b.order)
    .forEach((column) => {
      if (headers.includes(column.name)) {
        orderedHeaders.push(column.name);
      }
    });

  return orderedHeaders;
}

export async function setHeadersForReport(report) {
  // async because mData and mColumns need to be set before other things happen
  const validHeaderNames = validColumns.map((column) => column.name);
  const mColumns = report.headers
    .map((headerName) => {
      if (validHeaderNames.includes(headerName)) {
        return validColumns.find((column) => column.name === headerName);
      }
    })
    .filter((column) => column !== undefined);

  report.headers = mColumns;
  return report;
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
      const column = validColumns.find((col) => col.name === key);
      const formattedText = column.transform
        ? column.transform(numericValue)
        : value;

      let fixedClasses = null;
      if (key === "#") {
        fixedClasses = "fixed-column fixed-column-0";
      } else if (key === "Name") {
        fixedClasses = "fixed-column fixed-column-1";
      }
      return {
        text: formattedText,
        html: formattedText,
        sortValue: isNaN(numericValue) ? value.toLowerCase() : numericValue,
        align: column.align,
        FixedClasses: fixedClasses,
      };
    });

    return {
      index: index,
      columns: columns,
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
