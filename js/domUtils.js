export function createHeaderRow(mColumns) {
  const headerRow = document.getElementById("p-columns");
  mColumns.forEach((column) => {
    const th = document.createElement("th");
    th.className = `stats-col stats-col-header align-${column.align} min-width-${column.minWidth ? column.minWidth : "3"}`;
    const displayName = column.displayName ? column.displayName : column.name;
    th.textContent = displayName;
    headerRow.appendChild(th);
  });
}

export function populateDropdown(requestedReportID) {
  const reportSelect = document.getElementById("report-select");
  for (const key in reports) {
    const option = document.createElement("option");
    option.value = key;
    option.textContent = reports[key].title;
    reportSelect.appendChild(option);
  }

  reportSelect.value = requestedReportID;
}

export function createTableRows(mData) {
  const tableBody = document.getElementById("p-table-body");

  for (let i = 0; i < mData.length; i++) {
    const tr = document.createElement("tr");
    tr.className = i % 2 === 0 ? "even" : "odd";

    mData[i].columns.forEach((column) => {
      const td = document.createElement("td");
      td.textContent = column.text;
      td.className = `stats-col align-${column.align}`;
      if (column.FixedClasses) {
        td.className += ` ${column.FixedClasses}`;
      }
      tr.appendChild(td);
    });

    tableBody.appendChild(tr);
  }
}

export function populateInfoIcon(report) {
    const isoString = report.lastUpdatedAt;
    const date = new Date(isoString);
  
    const options = {
      year: "numeric",
      month: "short",
      day: "numeric",
      weekday: "long",
      hour: "numeric",
      minute: "2-digit",
    };
    const localDateString = date.toLocaleString(undefined, options);
    document.getElementById(
      "info-text"
    ).innerHTML = `<strong>${report.title}</strong> last updated on<br/> ${localDateString}`;
  }
