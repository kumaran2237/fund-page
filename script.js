const apiURL = "https://api.mfapi.in/mf/125497";

let fullData = [];
let chart;

async function loadFundData() {
  showLoading(true);

  const res = await fetch(apiURL);
  const json = await res.json();

  fullData = json.data
    .map(d => ({
      date: new Date(d.date.split("-").reverse().join("-")),
      nav: parseFloat(d.nav)
    }))
    .sort((a, b) => a.date - b.date);

  buildChart(fullData);
  showLoading(false);
}

function showLoading(state) {
  document.getElementById("loading").style.display = state ? "block" : "none";
}

function filterRange(range) {
  const now = new Date();
  let startDate;

  switch (range) {
    case "1m": startDate = new Date(now.setMonth(now.getMonth() - 1)); break;
    case "3m": startDate = new Date(now.setMonth(now.getMonth() - 3)); break;
    case "6m": startDate = new Date(now.setMonth(now.getMonth() - 6)); break;
    case "1y": startDate = new Date(now.setFullYear(now.getFullYear() - 1)); break;
    case "5y": startDate = new Date(now.setFullYear(now.getFullYear() - 5)); break;
    default:  return fullData;
  }

  return fullData.filter(d => d.date >= startDate);
}

function buildChart(data) {
  if (!data.length) return;

  if (chart) chart.destroy();

  const ctx = document.getElementById("navChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: data.map(d =>
        d.date.toISOString().split("T")[0]
      ),
      datasets: [
        {
          label: "NAV",
          data: data.map(d => d.nav),
          borderColor: "blue",
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      animation: { duration: 800 },
      scales: { x: { display: true }, y: { display: true } }
    }
  });
}

document.querySelectorAll(".time-buttons button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".time-buttons button").forEach(b =>
      b.classList.remove("active")
    );

    btn.classList.add("active");

    const range = btn.getAttribute("data-range");

    const filtered = filterRange(range);

    // FIX: graph disappearing — always rebuild chart
    buildChart(filtered);
  });
});

loadFundData();









