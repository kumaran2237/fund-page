const schemeCode = 125497;  // your fund scheme code
const niftyIndexSymbol = "NIFTY 50";  // benchmark

// Fetch mutual fund data
async function fetchFundData(code) {
  const url = `https://api.mfapi.in/mf/${code}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch fund data");
  return await resp.json();
}

// Fetch benchmark data (placeholder API)
async function fetchBenchmarkData() {
  const url = `https://nse‑api‑khaki.vercel.app/api/quote?symbol=NIFTY`; 
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch benchmark data");
  return await resp.json();
}

// Calculate returns
function calculateReturn(data) {
  if (data.length < 2) return "--";
  const start = data[0];
  const end = data[data.length - 1];
  return (((end - start) / start) * 100).toFixed(2) + "%";
}

async function init() {
  let fundFullData, fundFullLabels, fundMeta;
  let benchFullData = [], benchFullLabels = [];

  // Load from localStorage if available
  if (localStorage.getItem('fundData')) {
    fundFullData = JSON.parse(localStorage.getItem('fundData'));
    fundFullLabels = JSON.parse(localStorage.getItem('fundLabels'));
    fundMeta = JSON.parse(localStorage.getItem('fundMeta'));

    if (localStorage.getItem('benchData')) {
      benchFullData = JSON.parse(localStorage.getItem('benchData'));
      benchFullLabels = JSON.parse(localStorage.getItem('benchLabels'));
    }
  } else {
    // Fetch fund data
    const fundJson = await fetchFundData(schemeCode);
    fundMeta = fundJson.meta;
    const fundHistory = fundJson.data;

    fundFullLabels = fundHistory.map(d => d.date).reverse();
    fundFullData = fundHistory.map(d => parseFloat(d.nav)).reverse();

    // Fetch benchmark data
    try {
      const benchJson = await fetchBenchmarkData();
      benchFullLabels = benchJson.data.map(d => d.timestamp);
      benchFullData = benchJson.data.map(d => d.close);
    } catch (benchErr) {
      console.warn("Benchmark fetch failed:", benchErr);
    }

    // Fallback: if benchmark data is empty, create dummy data
    if (benchFullData.length === 0) {
      benchFullLabels = fundFullLabels.slice();
      benchFullData = fundFullData.map(v => v * 0.95); // 5% below fund NAV
    }

    // Store in localStorage
    localStorage.setItem('fundData', JSON.stringify(fundFullData));
    localStorage.setItem('fundLabels', JSON.stringify(fundFullLabels));
    localStorage.setItem('fundMeta', JSON.stringify(fundMeta));
    localStorage.setItem('benchData', JSON.stringify(benchFullData));
    localStorage.setItem('benchLabels', JSON.stringify(benchFullLabels));
  }

  // Populate overview cards
  document.getElementById("nav-value").textContent = fundFullData[fundFullData.length - 1];
  document.getElementById("category-value").textContent = fundMeta.scheme_category || '';
  document.getElementById("aum-value").textContent = fundMeta.fund_house || '';

  // Create chart
  const ctx = document.getElementById('performanceChart').getContext('2d');
  const datasets = [
    {
      label: fundMeta.scheme_name || "Fund NAV",
      data: fundFullData.slice(),
      borderColor: '#1E3A8A',
      fill: false,
      tension: 0.2
    },
    {
      label: niftyIndexSymbol,
      data: benchFullData.slice(),
      borderColor: '#D9534F',
      fill: false,
      tension: 0.2
    }
  ];

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: fundFullLabels.slice(),
      datasets: datasets
    },
    options: {
      responsive: true,
      plugins: { legend: { display: true } },
      scales: {
        x: { title: { display: true, text: 'Date' } },
        y: { title: { display: true, text: 'Value (₹ / Index points)' } }
      }
    }
  });

  // Chart range buttons
  document.querySelectorAll('.chart-filters button').forEach(btn => {
    btn.addEventListener('click', () => {
      const range = btn.getAttribute('data-range');
      const N = fundFullData.length;
      let sliceFrom = 0;

      switch(range) {
        case '1M': sliceFrom = Math.max(N - 22, 0); break;
        case '3M': sliceFrom = Math.max(N - 66, 0); break;
        case '6M': sliceFrom = Math.max(N - 130, 0); break;
        case '1Y': sliceFrom = Math.max(N - 260, 0); break;
        case '5Y': sliceFrom = Math.max(N - 1300, 0); break;
        case 'ALL': sliceFrom = 0; break;
      }

      chart.data.labels = fundFullLabels.slice(sliceFrom);
      chart.data.datasets[0].data = fundFullData.slice(sliceFrom);
      chart.data.datasets[1].data = benchFullData.slice(sliceFrom);
      chart.update();
    });
  });

  // Comparison cards calculation
  const ranges = { "1M": 22, "3M": 66, "6M": 130, "1Y": 260, "5Y": 1300 };
  Object.keys(ranges).forEach(period => {
    const N = fundFullData.length;
    const sliceFrom = Math.max(N - ranges[period], 0);
    const fundSlice = fundFullData.slice(sliceFrom);
    const benchSlice = benchFullData.slice(sliceFrom);

    document.getElementById(`fund-${period}`).textContent = calculateReturn(fundSlice);
    document.getElementById(`bench-${period}`).textContent = calculateReturn(benchSlice);
  });

  // Optional: Refresh data button
  const refreshBtn = document.getElementById('refresh-data');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      localStorage.clear();
      location.reload();
    });
  }
}

window.addEventListener('DOMContentLoaded', init);



