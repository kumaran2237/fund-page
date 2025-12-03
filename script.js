const schemeCode = 125497;  // <‑ your fund scheme code
const niftyIndexSymbol = "NIFTY 50";  // benchmark

// Fetch mutual fund data
async function fetchFundData(code) {
  const url = `https://api.mfapi.in/mf/${code}`;
  const resp = await fetch(url);
  if (!resp.ok) throw new Error("Failed to fetch fund data");
  return await resp.json();
}

// Fetch benchmark data (placeholder / example)
async function fetchBenchmarkData() {
  // Replace this URL with a working benchmark API if available
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
  try {
    const fundJson = await fetchFundData(schemeCode);
    const fundMeta = fundJson.meta;
    const fundHistory = fundJson.data;

    // Prepare fund arrays
    const fundLabels = fundHistory.map(d => d.date).reverse();
    const fundData = fundHistory.map(d => parseFloat(d.nav)).reverse();

    // Try fetching benchmark data
    let benchLabels = [], benchData = [];
    try {
      const benchJson = await fetchBenchmarkData();
      // Example parsing — adjust based on actual API response
      benchLabels = benchJson.data.map(d => d.timestamp); 
      benchData = benchJson.data.map(d => d.close);
    } catch (benchErr) {
      console.warn("Could not fetch benchmark data, skipping benchmark chart:", benchErr);
    }

    // Populate overview cards
    document.getElementById("nav-value").textContent = fundHistory[0].nav;
    document.getElementById("category-value").textContent = fundMeta.scheme_category || '';
    document.getElementById("aum-value").textContent = fundMeta.fund_house || '';

    // Create chart
    const ctx = document.getElementById('performanceChart').getContext('2d');
    const datasets = [
      {
        label: fundMeta.scheme_name || "Fund NAV",
        data: fundData,
        borderColor: '#1E3A8A',
        fill: false,
        tension: 0.2
      }
    ];
    if (benchData.length) {
      datasets.push({
        label: niftyIndexSymbol,
        data: benchData,
        borderColor: '#D9534F',
        fill: false,
        tension: 0.2
      });
    }

    const chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: fundLabels,
        datasets: datasets
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: true }
        },
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
        const N = fundData.length;
        let sliceFrom = 0;
        switch(range) {
          case '1M': sliceFrom = Math.max(N - 22, 0); break;
          case '3M': sliceFrom = Math.max(N - 66, 0); break;
          case '6M': sliceFrom = Math.max(N - 130, 0); break;
          case '1Y': sliceFrom = Math.max(N - 260, 0); break;
          case '5Y': sliceFrom = Math.max(N - 1300, 0); break;
          case 'ALL': sliceFrom = 0; break;
        }
        chart.data.labels = fundLabels.slice(sliceFrom);
        chart.data.datasets.forEach(ds => {
          ds.data = ds.data.slice(sliceFrom);
        });
        chart.update();
      });
    });

    // Comparison cards calculation
    const ranges = {
      "1M": 22,
      "3M": 66,
      "6M": 130,
      "1Y": 260,
      "5Y": 1300
    };

    Object.keys(ranges).forEach(period => {
      const N = fundData.length;
      const sliceFrom = Math.max(N - ranges[period], 0);
      const fundSlice = fundData.slice(sliceFrom);
      const benchSlice = benchData.length ? benchData.slice(sliceFrom) : [];

      document.getElementById(`fund-${period}`).textContent = calculateReturn(fundSlice);
      document.getElementById(`bench-${period}`).textContent = benchSlice.length ? calculateReturn(benchSlice) : "--";
    });

  } catch (err) {
    console.error("Error initializing fund + benchmark chart:", err);
  }
}

window.addEventListener('DOMContentLoaded', init);
