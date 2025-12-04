// ===========================
// CONFIG
// ===========================
const schemeCode = 125497; 
const benchmarkSymbol = "^NSEI";  // NIFTY 50 Yahoo symbol

let navHistory = [];
let chartInstance = null;

// ===========================
// FETCH FUND DATA
// ===========================
async function loadFundData() {
    const url = `https://api.mfapi.in/mf/${schemeCode}`;

    const res = await fetch(url);
    const data = await res.json();

    document.querySelector("#nav").innerText = data.data[0].nav;

    navHistory = data.data
        .map(x => ({ date: x.date, nav: parseFloat(x.nav) }))
        .reverse();

    updateChart(navHistory); // initial load
}

// ===========================
// FETCH BENCHMARK RETURNS
// ===========================
async function fetchBenchmark(periodDays) {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${benchmarkSymbol}?range=1y&interval=1d`;
    const res = await fetch(url);
    const data = await res.json();

    const prices = data.chart.result[0].indicators.quote[0].close;
    const timestamps = data.chart.result[0].timestamp;

    let list = timestamps.map((t, i) => ({
        date: new Date(t * 1000),
        close: prices[i]
    }));

    list = list.filter(p => p.close !== null);

    const end = list[list.length - 1].close;
    const start = list[Math.max(0, list.length - periodDays)].close;

    return (((end - start) / start) * 100).toFixed(2);
}

// ===========================
// CALCULATE FUND RETURN
// ===========================
function calcFundReturn(days) {
    if (navHistory.length < days) return "--";

    const start = navHistory[navHistory.length - days].nav;
    const end = navHistory[navHistory.length - 1].nav;

    return (((end - start) / start) * 100).toFixed(2);
}

// ===========================
// UPDATE RETURN CARDS
// ===========================
async function updateReturnCards(days) {
    const fundReturn = calcFundReturn(days);
    const benchmarkReturn = await fetchBenchmark(days);

    document.querySelector("#fund-return").innerText = `Fund Return: ${fundReturn}%`;
    document.querySelector("#benchmark-return").innerText = `Benchmark: ${benchmarkReturn}%`;
}

// ===========================
// UPDATE CHART
// ===========================
function updateChart(dataSlice) {
    const ctx = document.getElementById("chart").getContext("2d");

    const labels = dataSlice.map(x => x.date);
    const values = dataSlice.map(x => x.nav);

    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "NAV",
                data: values,
                borderWidth: 2,
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

// ===========================
// TIME RANGE BUTTON HANDLERS
// ===========================
function handlePeriod(days) {
    const slicedData = navHistory.slice(-days);
    updateChart(slicedData);
    updateReturnCards(days);
}

document.getElementById("btn-1m").onclick = () => handlePeriod(30);
document.getElementById("btn-3m").onclick = () => handlePeriod(90);
document.getElementById("btn-6m").onclick = () => handlePeriod(180);
document.getElementById("btn-1y").onclick = () => handlePeriod(365);
document.getElementById("btn-5y").onclick = () => handlePeriod(365 * 5);
document.getElementById("btn-all").onclick = () => {
    updateChart(navHistory);
    updateReturnCards(navHistory.length - 1);
};

// ===========================
// INIT
// ===========================
loadFundData();






