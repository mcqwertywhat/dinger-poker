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
  document.getElementById("report-select").addEventListener("change", () => {
    requestedReportID = document.getElementById("report-select").value;
    window.location.href = `index.html?id=${requestedReportID}`;
  });
}
