let allRace = [], allLap = [], race_by_lap = []
let selectedLap = 1

document.addEventListener('DOMContentLoaded', function () {
    
    let backgroundColor = localStorage.getItem('backgroundColor');

    document.body.style.backgroundColor = backgroundColor
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';

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

function isColorEqual(color1, color2) {
    function rgbToHex(rgb) {
        const hex = Number(rgb).toString(16);
        return hex.length < 2 ? "0" + hex : hex;
    }

    function fullColorHex(r, g, b) {
        const red = rgbToHex(r);
        const green = rgbToHex(g);
        const blue = rgbToHex(b);
        return red + green + blue;
    }

    function getRGBValues(color) {
        const match = color.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        if (match) {
            return {
                r: parseInt(match[1], 10),
                g: parseInt(match[2], 10),
                b: parseInt(match[3], 10),
            };
        }
        return null;
    }

    const color1RGB = getRGBValues(color1);
    const color2RGB = getRGBValues(color2);

    if (color1RGB && color2RGB) {
        const hex1 = fullColorHex(color1RGB.r, color1RGB.g, color1RGB.b);
        const hex2 = fullColorHex(color2RGB.r, color2RGB.g, color2RGB.b);
        return hex1 === hex2;
    }

    return false;
}

function createChart(canvasId, label, data) {
    let bg_color = document.body.style.backgroundColor;
    if (bg_color === "antiquewhite") {
        bg_color = "black";
    }

    const existingChart = Chart.getChart(canvasId);

    if (existingChart) {
        existingChart.destroy();

        const resetButtonContainer = document.querySelector(`#${canvasId}_reset_button`);
        if (resetButtonContainer) {
            resetButtonContainer.parentNode.removeChild(resetButtonContainer);
        }
    }

    const chartData = {
        labels: data.map((value, index) => index + 1),
        datasets: [{
            label: label,
            backgroundColor: "antiquewhite",
            borderColor: bg_color,
            data: data,
            fill: false,
            pointRadius: 0,
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
        interaction: {
            mode: 'index',
            intersect: false,
        },
        tooltips: {
            enabled: true,
            mode: 'index',
            intersect: false,
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

    const resetButtonContainer = document.createElement('div');
    resetButtonContainer.id = `${canvasId}_reset_button`;
    resetButtonContainer.classList.add('reset_button');
    resetButtonContainer.appendChild(resetButton);

    canvas.parentNode.insertBefore(resetButtonContainer, canvas);
}



function changeLap(change) {
    if (selectedLap + change >= 1 && selectedLap + change <= allLap.length - 1) {
        selectedLap += change
        document.getElementById("currentLap").innerHTML = selectedLap
        createChartbyLap()
    }
}