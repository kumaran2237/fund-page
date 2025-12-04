const schemeCode = 125497;
let fullNavData = [];
let chart;

// Fetch Fund Data
async function fetchFundData() {
  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  const data = await res.json();

  // Overview Values
  document.getElementById("nav-value").textContent =
    data.data[data.data.length - 1].nav;

  document.getElementById("aum-value").textContent = data.meta?.fund_house || "--";
  document.getElementById("category-value").textContent = data.meta?.scheme_category || "--";

  fullNavData = data.data.reverse(); // Arranged oldest → newest
  updateChart("ALL");
}

function filterData(range) {
  const now = new Date();
  const ranges = {
    "1M": 30,
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825
  };

  if (range === "ALL") return fullNavData;

  const days = ranges[range];

  return fullNavData.filter(entry => {
    const diff = (now - new Date(entry.date)) / (1000 * 60 * 60 * 24);
    return diff <= days;
  });
}

function updateChart(range) {
  const chartData = filterData(range);

  const labels = chartData.map(d => d.date);
  const values = chartData.map(d => parseFloat(d.nav));

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("performanceChart"), {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "NAV",
        data: values,
        borderColor: "#1a73e8",
        backgroundColor: "rgba(26,115,232,0.2)",
        fill: true,
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `NAV: ₹${ctx.raw}`
          }
        }
      },
      scales: {
        x: { ticks: { maxTicksLimit: 8 } },
        y: { beginAtZero: false }
      }
    }
  });
}

// Range Button Click
document.querySelectorAll(".chart-filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".chart-filters .active")?.classList.remove("active");
    btn.classList.add("active");

    updateChart(btn.dataset.range);
  });
});

// Init
fetchFundData();







