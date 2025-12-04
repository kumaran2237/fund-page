const schemeCode = 125497;
let fullNavData = [];
let chart;

// Show loading spinner
function showLoading() {
  document.getElementById("performanceChart").style.display = "none";
  document.getElementById("loader").style.display = "block";
}

// Hide loading spinner
function hideLoading() {
  document.getElementById("performanceChart").style.display = "block";
  document.getElementById("loader").style.display = "none";
}

// Fetch Fund Data
async function fetchFundData() {
  showLoading();

  const res = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
  const data = await res.json();

  // Overview Values
  document.getElementById("nav-value").textContent =
    data.data[data.data.length - 1].nav;

  document.getElementById("aum-value").textContent = data.meta?.fund_house || "--";
  document.getElementById("category-value").textContent =
    data.meta?.scheme_category || "--";

  fullNavData = data.data.reverse(); // oldest → newest order
  updateChart("ALL");

  hideLoading();
}

// Return % calculator
function calculatePercentage(data) {
  if (data.length < 2) return Array(data.length).fill(0);

  const first = parseFloat(data[0].nav);
  return data.map(d => (((parseFloat(d.nav) - first) / first) * 100).toFixed(2));
}

// Filter Data based on range
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

// Update Chart
function updateChart(range) {
  const filtered = filterData(range);

  const labels = filtered.map(d => d.date);
  const navValues = filtered.map(d => parseFloat(d.nav));
  const percentValues = calculatePercentage(filtered);

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("performanceChart"), {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "NAV",
          data: navValues,
          borderColor: "#1a73e8",
          backgroundColor: "rgba(26,115,232,0.2)",
          yAxisID: "y",
          fill: true,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: "% Returns",
          data: percentValues,
          borderColor: "#e63946",
          backgroundColor: "rgba(230,57,70,0.2)",
          yAxisID: "y1",
          fill: false,
          tension: 0.4,
          borderWidth: 2,
          pointRadius: 0
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1200,
        easing: "easeOutQuart"
      },
      plugins: {
        tooltip: {
          mode: "index",
          intersect: false,
          callbacks: {
            label: (ctx) => {
              if (ctx.dataset.label === "NAV") {
                return `NAV: ₹${ctx.raw}`;
              }
              return `% Return: ${ctx.raw}%`;
            }
          }
        },
        legend: {
          labels: {
            usePointStyle: true
          }
        }
      },
      scales: {
        y: {
          type: "linear",
          position: "left",
        },
        y1: {
          type: "linear",
          position: "right",
          grid: { drawOnChartArea: false }
        }
      }
    }
  });
}

// Button Click Events
document.querySelectorAll(".chart-filters button").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelector(".chart-filters .active")?.classList.remove("active");
    btn.classList.add("active");
    updateChart(btn.dataset.range);
  });
});

// Init
fetchFundData();










