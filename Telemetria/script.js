let allRace = [], allLap = [], race_by_lap = []
let selectedLap = 1

document.addEventListener('DOMContentLoaded', function () {
    const fetchPromises = [];

    fetchPromises.push(
        fetch('allRace.json')
            .then(response => response.json())
            .then(data => {
                allRace = data;
            })
            .catch(error => console.error('Error fetching JSON data:', error))
    );

    fetchPromises.push(
        fetch('allLap.json')
            .then(response => response.json())
            .then(data => {
                allLap = data;
            })
            .catch(error => console.error('Error fetching JSON data:', error))
    );

    Promise.all(fetchPromises)
        .then(() => {
            RaceLap();
        })
        .catch(error => console.error('Error fetching JSON data:', error));
});

function RaceLap() {
    for (let lap = 0; lap < allLap.length - 1; lap++) {

        if (allLap) {

            let lap_data = [];

            for (let data = 0; data < allRace.length; data++) {
                if (allRace[data]) {
                    if (allLap[lap + 1].date_start < allRace[data].date) {
                        allRace.splice(0, data)
                        break;
                    }
                    lap_data.push(allRace[data]);
                }
            }
            race_by_lap.push(lap_data);
        }
    }
    race_by_lap[0] = []

    createChartbyLap()

}

function createChartbyLap() {
    createChart('gearChart', 'Gear', race_by_lap[selectedLap].map(entry => entry.n_gear));
    createChart('throttleChart', 'Throttle', race_by_lap[selectedLap].map(entry => entry.throttle));
    createChart('brakeChart', 'Brake', race_by_lap[selectedLap].map(entry => entry.brake));
    createChart('speedChart', 'Speed', race_by_lap[selectedLap].map(entry => entry.speed));
    createChart('rpmChart', 'RPM', race_by_lap[selectedLap].map(entry => entry.rpm));
}

function createChart(canvasId, label, data) {
    const existingChart = Chart.getChart(canvasId);

    if (existingChart) {
        existingChart.destroy();
    }

    const chartData = {
        labels: data.map((value, index) => index + 1),
        datasets: [{
            label: label,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            data: data,
            fill: false,
        }]
    };

    const chartOptions = {
        plugins: {
            zoom: {
                zoom: {
                    wheel: {
                        enabled: true,
                    },
                    pinch: {
                        enabled: true
                    },
                    mode: 'xy',
                },
                pan: {
                    enabled: true,
                    mode: 'xy',
                },
                limits: {
                    x: { min: 'original', max: 'original' },
                    y: { min: 'original', max: 'original' },
                },
                reset: {
                    enabled: true,
                },
            }
        },
        scales: {
            x: {
                display: false,
            },
        },
    };

    const chartConfig = {
        type: 'line',
        data: chartData,
        options: chartOptions
    };

    const canvas = document.getElementById(canvasId);
    const ctx = canvas.getContext('2d');

    const myChart = new Chart(ctx, chartConfig);

    const resetButton = document.createElement('button');
    resetButton.innerHTML = 'Reset Zoom';
    resetButton.classList.add('reset-zoom-btn');

    resetButton.addEventListener('click', () => {
        myChart.resetZoom();
    });

    // Inserisci il pulsante sopra il canvas
    canvas.parentNode.insertBefore(resetButton, canvas);
}

function changeLap(change) {
    if (selectedLap + change >= 1 && selectedLap + change <= allLap.length - 1) {
        selectedLap += change
        document.getElementById("currentLap").innerHTML = selectedLap
        createChartbyLap()
    }
}