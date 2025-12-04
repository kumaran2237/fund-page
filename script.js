// ------------------------------------
// CONFIG
// ------------------------------------
const schemeCode = 125497;  // Your Mutual Fund Code
const benchmarkSymbol = "NIFTY 50";

let fundHistory = [];
let benchmarkHistory = [];
let chart;

// ------------------------------------
// FETCH FUND DATA (MFAPI)
// ------------------------------------
async function fetchFundData() {
  const url = `https://api.mfapi.in/mf/${schemeCode}`;
  const res = await fetch(url);
  const data = await res.json();

  // Convert MFAPI format
  fundHistory = data.data.map(item => ({
    date: new Date(item.date),
    nav: parseFloat(item.nav)
  })).reverse();

  // Fill UI
  document.getElementById("nav-value").innerText = data.data[0].nav;
  document.getElementById("aum-value").innerText = data.meta.aum || "--";
  document.getElementById("category-value").innerText = data.meta.scheme_category;

  return true;
}

// ------------------------------------
// FETCH BENCHMARK (NIFTY 50) — Yahoo API
// ------------------------------------
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

// ------------------------------------
// FILTER DATA BY RANGE
// ------------------------------------
function filterRange(data, months) {
  if (months === "ALL") return data;

  const now = new Date();
  const cutoff = new Date();

  if (months.endsWith("Y")) months = parseInt(months) * 12;

  cutoff.setMonth(now.getMonth() - parseInt(months));

  return data.filter(row => row.date >= cutoff);
}

// ------------------------------------
// UPGRADED PREMIUM CHART (Groww-style)
// ------------------------------------
function renderChart(range = "ALL") {
  const filteredFund = filterRange(fundHistory, range);
  const filteredBench = filterRange(benchmarkHistory, range);

  const labels = filteredFund.map(x => x.date.toISOString().split("T")[0]);
  const fundValues = filteredFund.map(x => x.nav);
  const benchValues = filteredBench.map(x => x.value);

  const ctx = document.getElementById("performanceChart").getContext("2d");

  // Destroy previous chart
  if (chart) chart.destroy();

  // Gradient for fund
  const gradientFund = ctx.createLinearGradient(0, 0, 0, 400);
  gradientFund.addColorStop(0, "rgba(0, 123, 255, 0.35)");
  gradientFund.addColorStop(1, "rgba(0, 123, 255, 0)");

  // Gradient for benchmark
  const gradientBench = ctx.createLinearGradient(0, 0, 0, 400);
  gradientBench.addColorStop(0, "rgba(255, 140, 0, 0.35)");
  gradientBench.addColorStop(1, "rgba(255, 140, 0, 0)");

  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Fund NAV",
          data: fundValues,
          borderColor: "#007bff",
          backgroundColor: gradientFund,
          fill: true,
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.25
        },
        {
          label: "NIFTY 50",
          data: benchValues,
          borderColor: "#ff8c00",
          backgroundColor: gradientBench,
          fill: true,
          borderWidth: 2.5,
          pointRadius: 0,
          tension: 0.25
        }
      ]
    },
    options: {
      animation: {
        duration: 900,
        easing: "easeOutQuart"
      },
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        x: {
          ticks: {
            maxTicksLimit: 8,
            color: "#444"
          },
          grid: { display: false }
        },
        y: {
          ticks: {
            color: "#444",
            callback: val => val.toFixed(2)
          },
          grid: { color: "rgba(0,0,0,0.05)" }
        }
      },
      plugins: {
        tooltip: {
          backgroundColor: "rgba(0,0,0,0.75)",
          titleColor: "#fff",
          bodyColor: "#fff",
          padding: 10,
          callbacks: {
            label: function (ctx) {
              return `${ctx.dataset.label}: ₹${ctx.raw.toFixed(2)}`;
            }
          }
        },
        legend: {
          labels: { font: { size: 14 } }
        }
      }
    }
  });
}

// ------------------------------------
// RETURN CALCULATION
// ------------------------------------
function calculateReturn(history, months) {
  const filtered = filterRange(history, months);
  if (filtered.length < 2) return "--";

  const start = filtered[0].value || filtered[0].nav;
  const end = filtered[filtered.length - 1].value || filtered[filtered.length - 1].nav;

  return (((end - start) / start) * 100).toFixed(2) + "%";
}

// ------------------------------------
// UPDATE COMPARISON CARDS
// ------------------------------------
function updateComparison() {
  const periods = ["1M", "3M", "6M", "1Y", "5Y"];

  periods.forEach(period => {
    document.getElementById(`fund-${period}`).innerText = calculateReturn(fundHistory, period);
    document.getElementById(`bench-${period}`).innerText = calculateReturn(benchmarkHistory, period);
  });

  document.getElementById("fund-return").innerText = calculateReturn(fundHistory, "ALL");
  document.getElementById("benchmark-return").innerText = calculateReturn(benchmarkHistory, "ALL");
}

// ------------------------------------
// BUTTON EVENTS (1M / 3M / 6M / 1Y / 5Y / ALL)
// ------------------------------------
document.querySelectorAll(".chart-filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    renderChart(btn.dataset.range);
  });
});

// ------------------------------------
// INITIALIZE DASHBOARD
// ------------------------------------
async function init() {
  await fetchFundData();
  await fetchBenchmark();

  renderChart("ALL");
  updateComparison();
}

init();





