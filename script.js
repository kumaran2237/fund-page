// ----------------------------
// CONFIG
// ----------------------------
const schemeCode = 125497;  // Your Mutual Fund Code
const benchmarkSymbol = "NIFTY 50";

// Global variables
let fundHistory = [];
let benchmarkHistory = [];
let chart;

// ----------------------------
// FETCH FUND DATA
// ----------------------------
async function fetchFundData() {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url);
  const data = await res.json();

  // Store history
  fundHistory = data.data.map(item => ({
    date: new Date(item.date),
    nav: parseFloat(item.nav)
  })).reverse(); // reverse to oldest → latest

  // Fill Overview section
  document.getElementById("nav-value").innerText = data.data[0].nav;
  document.getElementById("aum-value").innerText = data.meta.aum || "--";
  document.getElementById("category-value").innerText = data.meta.scheme_category;

  return true;
}

// ----------------------------
// FETCH BENCHMARK DATA (NIFTY 50)
// THIS USES YAHOO FINANCE V8 API
// ----------------------------
async function fetchBenchmark() {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI?range=5y&interval=1d`;
  const res = await fetch(url);
  const json = await res.json();

  let timestamps = json.chart.result[0].timestamp;
  let closes = json.chart.result[0].indicators.quote[0].close;

  benchmarkHistory = timestamps.map((t, i) => ({
    date: new Date(t * 1000),
    value: closes[i]
  }));

  return true;
}

// ----------------------------
// FILTER DATA BY RANGE
// ----------------------------
function filterRange(data, months) {
  if (months === "ALL") return data;

  const now = new Date();
  const cutoff = new Date();

  if (months.endsWith("Y")) months = parseInt(months) * 12;

  cutoff.setMonth(now.getMonth() - parseInt(months));

  return data.filter(item => item.date >= cutoff);
}

// ----------------------------
// CREATE / UPDATE CHART
// ----------------------------
function renderChart(range = "ALL") {
  const filteredFund = filterRange(fundHistory, range);
  const filteredBench = filterRange(benchmarkHistory, range);

  const labels = filteredFund.map(x => x.date.toISOString().split("T")[0]);
  const fundValues = filteredFund.map(x => x.nav);
  const benchValues = filteredBench.map(x => x.value);

  if (chart) chart.destroy();

  const ctx = document.getElementById("performanceChart").getContext("2d");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Fund NAV",
          data: fundValues,
          borderColor: "blue",
          tension: 0.2
        },
        {
          label: "Nifty 50",
          data: benchValues,
          borderColor: "orange",
          tension: 0.2
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
}

// ----------------------------
// CALCULATE RETURNS
// ----------------------------
function calculateReturn(history, months) {
  const filtered = filterRange(history, months);
  if (filtered.length < 2) return "--";

  const start = filtered[0].value || filtered[0].nav;
  const end = filtered[filtered.length - 1].value || filtered[filtered.length - 1].nav;

  return (((end - start) / start) * 100).toFixed(2) + "%";
}

// ----------------------------
// UPDATE COMPARISON CARDS
// ----------------------------
function updateComparison() {
  const periods = ["1M", "3M", "6M", "1Y", "5Y"];

  periods.forEach(p => {
    document.getElementById(`fund-${p}`).innerText = calculateReturn(fundHistory, p);
    document.getElementById(`bench-${p}`).innerText = calculateReturn(benchmarkHistory, p);
  });

  // Overall return
  document.getElementById("fund-return").innerText = calculateReturn(fundHistory, "ALL");
  document.getElementById("benchmark-return").innerText = calculateReturn(benchmarkHistory, "ALL");
}

// ----------------------------
// SETUP BUTTON EVENTS
// ----------------------------
document.querySelectorAll(".chart-filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    renderChart(btn.dataset.range);
  });
});

// ----------------------------
// INITIALIZATION
// ----------------------------
async function init() {
  await fetchFundData();
  await fetchBenchmark();

  renderChart("ALL");
  updateComparison();
}

init();




