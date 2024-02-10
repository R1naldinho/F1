const CURRENT_RACE = "https://ergast.com/api/f1/current.json";
window.onload = function () {
    getRaces()
    addDriverDropdown()
}

function removeFixedPosition() {
    if (window.matchMedia('(max-width: 1224px)').matches) {
        document.querySelectorAll('.position-fixed').forEach(function (element) {
            element.classList.remove('position-fixed');
        });
    } else {
        document.querySelectorAll('.card#pos-fixed').forEach(function (element) {
            element.classList.add('position-fixed');
        });
    }
}

document.addEventListener('DOMContentLoaded', removeFixedPosition);
window.addEventListener('resize', removeFixedPosition);

let switchPoints = true;

function toggleSwitch() {
    switchPoints = !switchPoints;
    if (switchPoints == true) {
        document.getElementById("switchStatus").innerHTML = "Now setted on: Total Points"
    } else {
        document.getElementById("switchStatus").innerHTML = "Now setted on: Race Points"
    }
}

async function getDrivers() {
    const URL = `https://ergast.com/api/f1/current/driverStandings.json`
    let drivers = new Array()

    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.StandingsTable.StandingsLists[0].DriverStandings

        results.forEach((result) => {
            const driverObj = {
                "name": result.Driver.givenName,
                "surname": result.Driver.familyName,
                "id": result.Driver.driverId,
            }
            drivers.push(driverObj)
        });
    } catch (error) {
        console.error(error)
    }
    return drivers
}

async function addDriverDropdown() {
    const drivers = await getDrivers();

    const formGroupEl = document.createElement("div");
    formGroupEl.classList.add("form-group");

    const selectEl = document.createElement("select");
    selectEl.classList.add("form-select");
    selectEl.setAttribute("id", "driverSelect");
    formGroupEl.appendChild(selectEl);

    for (let i = 0; i < drivers.length; i++) {
        const optionEl = document.createElement("option");
        optionEl.setAttribute("value", JSON.stringify({ "id": drivers[i].id, "name": drivers[i].name, "surname": drivers[i].surname }));
        optionEl.textContent = drivers[i].name + " " + drivers[i].surname;
        selectEl.appendChild(optionEl);
    }

    const containerEl = document.querySelector("#dropdown");
    containerEl.appendChild(formGroupEl);
}

async function getPoints() {
    const driver = JSON.parse(document.getElementById("driverSelect").value)
    const driverId = driver.id


    const URL = `https://ergast.com/api/f1/current/drivers/${driverId}/results.json`

    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races

        document.getElementById("chartModalLabel").innerHTML = `${new Date().getFullYear()} - ${driver.name} ${driver.surname}`

        Allpoints = new Array()

        results.forEach((race) => {
            let points = 0

            if (switchPoints == true) {
                if (Allpoints.length - 1 >= 0) {
                    points = parseInt(Allpoints[Allpoints.length - 1].totalPoints) + parseInt(race.Results[0].points)
                } else {
                    points = parseInt(race.Results[0].points)
                }
            } else {
                points = parseInt(race.Results[0].points)
            }

            let racePoints = {
                "track": race.Circuit.circuitName,
                "points": race.Results[0].points,
                "totalPoints": points,
                "position": race.Results[0].position,
            }
            Allpoints.push(racePoints)
        })


    } catch (error) {
        console.error(error)
    }

    const circuitStyles = Allpoints.map((point) => {
        if (point.position === "1") {
            return { color: "orange", text: "rectRounded" };
        } else {
            return { color: "red", text: "circle" };
        }
    });


    const circuitNames = Allpoints.map((point) => point.track);
    const circuitPoints = Allpoints.map((point) => point.totalPoints);


    // Ottieni il canvas e crea il grafico
    const canvas = document.getElementById("myChart");
    const ctx = canvas.getContext("2d");

    if (Chart.getChart("myChart")) {
        Chart.getChart("myChart").destroy();
    }

    const chart = new Chart(ctx, {
        type: "line",
        data: {
            labels: circuitNames,
            datasets: [
                {
                    label: "Points",
                    data: circuitPoints,
                    backgroundColor: "rgba(255, 99, 132, 0.2)",
                    borderColor: "rgba(255, 99, 132, 1)",
                    borderWidth: 1,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                    pointBorderWidth: 1,
                    pointStyle: circuitStyles.map((style) => style.text),
                    pointBackgroundColor: circuitStyles.map((style) => style.color),
                    pointBorderColor: circuitStyles.map((style) => style.color),

                }
            ]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: true
                },
                x: {
                    ticks: {
                        callback: function (value, index, values) {
                            return `R${index + 1}`;
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            let label = `${context.dataset.label}: `;
                            label += `${context.label} - `;
                            label += `${Allpoints[context.dataIndex].points} points ( P${Allpoints[context.dataIndex].position} )`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}

async function getRaces() {
    try {
        const response = await fetch(CURRENT_RACE);
        const data = await response.json();

        const races = data.MRData.RaceTable.Races

        let raceListHTML = ""
        let raceCount = 1
        races.forEach((race) => {
            linkWiki = race.url
            raceListHTML += `<div class="card race-card ">
                              <div class="card-body">
                              <h5 class="card-title">${raceCount}° Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country})</p>
                                <p class="card-text">${new Date(race.date + 'T' + race.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                <p class="card-text">
                                    
                                </p>
                                <p class="card-text">
                                    <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#infoModal" onclick="showInfo('${encodeURIComponent(JSON.stringify(race))}')">
                                        Show Circuit Info
                                    </button>
                                </p>`


            let today = new Date();
            today = new Date(today.getTime() + 21600000)
            if (new Date(race.date + 'T' + race.time).getTime() < new Date(today).getTime()) {
                raceListHTML += `<p class="card-text">
                                    <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults(${raceCount})">
                                        See Results
                                    </button>
                                </p>`


            } else {
                raceListHTML += `<div class="row">
            <div class="col-6">
                <p class="card-text">
                    <button type="button" class="btn schedule btn-secondary" data-bs-toggle="modal" data-bs-target="#scheduleModal" onclick="showSchedule('${encodeURIComponent(JSON.stringify(race))}')">
                        See Schedule
                    </button>
                </p>
            </div>
            <div class="col-6">
                <div class="timer">
                    <p class="card-text">Remaining time:</p>
                    <p class="card-text" id="countdown${raceCount}"></p>
                </div>
            </div>
        </div>`;
                startCountdown(raceCount, race);
            }

            raceListHTML += "</div></div>"
            raceCount++
        });
        document.getElementById("race-list").innerHTML = raceListHTML
    } catch (error) {
        console.error(error)
    }
}

function startCountdown(raceCount, race) {
    let countDownDate = new Date(race.date + 'T' + race.time).getTime()

    let x = setInterval(function () {

        let now = new Date().getTime();

        let distance = countDownDate - now;

        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("countdown" + raceCount + "").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

        if (distance < 0) {
            clearInterval(x);
            alert(race.raceName + "HAS STARTED!");
            document.getElementById("countdown" + raceCount + "").innerHTML = "race live!"
        }
    }, 1000);
}







async function showResults(raceCount) {
    let year = new Date().getFullYear()
    let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/results.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].Results

        document.getElementById("resultModalLabel").innerHTML = `<a class="wikiLink" href="${data.MRData.RaceTable.Races[0].url}" target="_blank">Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}</a>`


        let resultList = `<div class="table-container"><table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Position</th>
                <th scope="col">Points</th>
                <th scope="col">Driver</th>
                <th scope="col">Number</th>
                <th scope="col">Constructor</th>
                <th scope="col">Laps</th>
                <th scope="col">Time</th>
                <th scope="col">Position Gained/Lost</th>
            </tr>
        </thead>
        <tbody>`
        results.forEach((result) => {
            let posSymbol


            if (result.grid != 0) {
                let posGained = result.grid - result.position

                if (posGained < 0) {
                    posSymbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-chevron-down" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg> ${-1 * posGained}`
                } else if (posGained == 0) {
                    posSymbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-dash-lg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
              </svg>`
                } else {
                    posSymbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-chevron-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
          </svg> ${posGained}`
                }
            } else {
                posSymbol = `Started from Pitlane`
            }

            resultList += `<tr>
                                <td>${result.positionText}</td>
                                <td>${result.points}</td>
                                <td><a class="infoLink" href="${result.Driver.url}" target="_blank">${result.Driver.givenName} ${result.Driver.familyName}</a></td>
                                <td>${result.number}</td>
                                <td><a class="infoLink" href="${result.Constructor.url}" target="_blank">${result.Constructor.name}</a></td>
                                <td>${result.laps}</td>`
            if (result.hasOwnProperty("Time")) {
                resultList += `<td>${result.Time.time}</td>`
            } else {
                resultList += `<td>${result.status}</td>`
            }

            resultList += `<td>${posSymbol}</td>
                            </tr>`
        })
        resultList += `</tbody>
        </table></div>`
        document.getElementById("result").innerHTML = resultList
        showFastestLap(year, raceCount)

    } catch (error) {
        console.error(error)
    }

}

async function showFastestLap(year, raceCount) {
    let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/fastest/1/results.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].Results[0]
        console.log(data.MRData.RaceTable.Races[0].Results[0])
        let resultList = `<table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Driver</th>
                <th scope="col">Number</th>
                <th scope="col">Constructor</th>
                <th scope="col">Time</th>
                <th scope="col">Lap</th>
                <th scope="col">Avarage Speed (km/h)</th>
            </tr>
        </thead>
        <tbody>
        <tr>
            <td><a class="infoLink" href="${results.Driver.url}" target="_blank">${results.Driver.givenName} ${results.Driver.familyName}</a></td>
            <td>${results.number}</td>
            <td><a class="infoLink" href="${results.Constructor.url}" target="_blank">${results.Constructor.name}</a></td>
            <td>${results.FastestLap.Time.time}</td>
            <td>${results.FastestLap.lap}</td>
            <td>${results.FastestLap.AverageSpeed.speed}</td>
            <td>
        </tr>
                            </tbody>
        </table>`
        document.getElementById("fastestLapLabel").innerHTML = "Fastest Lap:"
        document.getElementById("fastestLap").innerHTML = resultList

    } catch (error) {
        console.error(error)
    }
}

function showSchedule(race) {
    race = JSON.parse(decodeURIComponent(race))

    let events = []

    if (race.hasOwnProperty('FirstPractice')) {
        events.push({
            type: 'First Practice',
            date: race.FirstPractice.date,
            time: race.FirstPractice.time
        })
    }
    if (race.hasOwnProperty('SecondPractice')) {
        events.push({
            type: 'Second Practice',
            date: race.SecondPractice.date,
            time: race.SecondPractice.time
        })
    }
    if (race.hasOwnProperty('ThirdPractice')) {
        events.push({
            type: 'Third Practice',
            date: race.ThirdPractice.date,
            time: race.ThirdPractice.time
        })
    }

    if (race.hasOwnProperty('Sprint')) {
        events.push({
            type: 'Sprint',
            date: race.Sprint.date,
            time: race.Sprint.time
        })
    }
    if (race.hasOwnProperty('SprintQualyfing')) {
        // NON IMPLEMENTATO NELLE API
        events.push({
            type: 'Sprint Qualyfing',
            date: race.SprintQualyfing.date,
            time: race.SprintQualyfing.time
        })
    }

    if (race.hasOwnProperty('Qualifying')) {
        events.push({
            type: 'Qualifying',
            date: race.Qualifying.date,
            time: race.Qualifying.time
        })
    }

    //race
    events.push({
        type: 'Race',
        date: race.date,
        time: race.time
    })

    events.sort((a, b) => {
        let dateA = new Date(a.date + 'T' + a.time)
        let dateB = new Date(b.date + 'T' + b.time)
        return dateA - dateB
    })

    let scheduleList = `<div class="table-container"><table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Type:</th>
                <th scope="col">Time:</th>
            </tr>
        </thead>
        <tbody>`

    events.forEach(event => {
        scheduleList += `<tr>
        <th scope="row">${event.type}</th>
        <td>${new Date(event.date + 'T' + event.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td></tr>`
    })

    scheduleList += `</tbody>
        </table></div>`
    document.getElementById("schedule").innerHTML = scheduleList

}


async function championShow() {
    const URL = `https://ergast.com/api/f1/current/driverStandings.json`

    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.StandingsTable.StandingsLists[0].DriverStandings
        const totalRound = data.MRData.StandingsTable.StandingsLists[0].round

        document.getElementById("championModalLabel").innerHTML = `<h4>Total Round: ${totalRound}</h4>`


        let resultList = `<div class="modal-body" style="height: 100%;">
        <table class="table table-striped text-center">
            <thead>
                <tr>
                    <th scope="col">Position</th>
                    <th scope="col">Name</th>
                    <th scope="col">Constructor</th>
                    <th scope="col">Points</th>
                    <th scope="col">Wins</th>
                </tr>
            </thead>
            <tbody>`;

        results.forEach((result) => {

            let constructors = ""
            for (let i = 0; i < result.Constructors.length; i++) {
                constructors += `${result.Constructors[i].name}`
                if (i + 1 != result.Constructors.length) {
                    constructors += ',<br>'
                }
            }

            resultList += `<tr>
                <td>${result.positionText}</td>
                <td>${result.Driver.givenName} ${result.Driver.familyName}</td>
                <td>${constructors}</td>
                <td>${result.points}</td>
                <td>${result.wins}</td>
            </tr>`;
        });

        resultList += `</tbody>
            </table>
        </div>`;

        document.getElementById("championShow").innerHTML = resultList

    } catch (error) {
        console.error(error)
    }
}

async function constructorShow() {
    const URL = `https://ergast.com/api/f1/current/constructorStandings.json`


    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.StandingsTable.StandingsLists[0].ConstructorStandings
        const totalRound = data.MRData.StandingsTable.StandingsLists[0].round

        document.getElementById("constructorModalLabel").innerHTML = `<h4>Total Round: ${totalRound}</h4>`


        let resultList = `<div class="modal-body" style="height: 100%;">
            <table class="table table-striped text-center">
                <thead>
                    <tr>
                        <th scope="col">Position</th>
                        <th scope="col">Constructor</th>
                        <th scope="col">Points</th>
                        <th scope="col">Wins</th>
                    </tr>
                </thead>
                <tbody>`;

        results.forEach((result) => {
            resultList += `<tr>
                <td>${result.positionText}</td>
                <td>${result.Constructor.name}</td>
                <td>${result.points}</td>
                <td>${result.wins}</td>
            </tr>`;
        });

        resultList += `</tbody>
            </table>
        </div>`;

        document.getElementById("constructorShow").innerHTML = resultList

    } catch (error) {
        console.error(error)
    }


}

document.addEventListener('DOMContentLoaded', function () {
    let backgroundColor = localStorage.getItem('backgroundColor');
    document.body.style.backgroundColor = backgroundColor
    
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';

});


/*  MAPPA    */

var map = null;

function showInfo(race) {
    let circuit = JSON.parse(decodeURIComponent(race)).Circuit;

    document.getElementById("circuitLink").innerHTML = `<a class="infoLink" href="${circuit.url}" target="_blank">${circuit.circuitName}</a>`

    let table = `
    <div id="map"></div>
      <div class="table-container">
        <table class="table table-striped text-center">
          <tbody>
            <tr>
              <th scope="row">Country</th>
              <td>${circuit.Location.country}</td>
            </tr>
            <tr>
              <th scope="row">Location</th>
              <td>${circuit.Location.locality}</td>
            </tr>
          </tbody>
        </table>
      </div>`;

    document.getElementById("infoShow").innerHTML = table;


    $('#infoModal').on('shown.bs.modal', function () {
        if (map !== null) {
            map.remove();
            map = null;
        }

        map = L.map("map").setView(
            [circuit.Location.lat, circuit.Location.long],
            14.5
        );

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        marker = L.marker([circuit.Location.lat, circuit.Location.long]).addTo(map);
    });
}