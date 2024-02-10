window.onload = function () {
    year = new Date().getFullYear();
    addDropdown()
    addDriverDropdown()
    getRaces(year)
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
let selectedYear = new Date().getFullYear()

function toggleSwitch() {
    switchPoints = !switchPoints;
    if (switchPoints == true) {
        document.getElementById("switchStatus").innerHTML = "Now setted on:<br><h5 style='font-weight:bold'>Total Points</h5>"
    } else {
        document.getElementById("switchStatus").innerHTML = "Now setted on:<br><h5 style='font-weight:bold'>Race Points</h5>"
    }
}

async function getDrivers() {
    const URL = `https://ergast.com/api/f1/${selectedYear}/driverStandings.json`
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
        selectedYear--
        let calendarYear = document.getElementById("yearSelect")
        calendarYear.value = selectedYear
        return "error"
    }
    return drivers
}

async function addDriverDropdown() {
    let drivers = await getDrivers();
    if(drivers == "error"){
        drivers = await getDrivers();
        getRaces(selectedYear)
    }

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

    containerEl = document.querySelector("#dropdown");
    containerEl.appendChild(formGroupEl);
}

async function getPoints() {
    const driver = JSON.parse(document.getElementById("driverSelect").value)
    const driverId = driver.id

    const URL = `https://ergast.com/api/f1/${selectedYear}/drivers/${driverId}/results.json`

    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races

        document.getElementById("chartModalLabel").innerHTML = `${selectedYear} - ${driver.name} ${driver.surname}`

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
            responsive: true,
            maintainAspectRatio: false,
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
                            label += `${Allpoints[context.dataIndex].points} points ( P${Allpoints[context.dataIndex].position} )`;
                            return label;
                        }
                    }
                }
            }
        }
    });
}


function addDropdown() {

    const formGroupEl = document.createElement("div");
    formGroupEl.classList.add("form-group");

    const selectEl = document.createElement("select");
    selectEl.classList.add("form-select");
    selectEl.setAttribute("id", "yearSelect");
    formGroupEl.appendChild(selectEl);

    const startingYear = new Date().getFullYear();
    for (let anno = startingYear; anno >= 1950; anno--) {
        const optionEl = document.createElement("option");
        optionEl.setAttribute("value", anno);
        optionEl.textContent = anno;
        selectEl.appendChild(optionEl);
    }

    selectEl.addEventListener("change", function () {
        document.body.scrollTop = 0; // per Safari
        document.documentElement.scrollTop = 0; // per Chrome, Firefox, IE e Opera

        const selectedValue = this.value;
        selectedYear = selectedValue
        getRaces(parseInt(selectedValue))

        let driver = document.querySelector("#dropdown");
        driver.innerHTML = "";

        addDriverDropdown()
    });

    const containerEl = document.querySelector("#dropdownYear");
    containerEl.appendChild(formGroupEl);
}

function showSchedule(race) {
    race = JSON.parse(decodeURIComponent(race))
    console.log(race)

    document.getElementById("scheduleModalLabel").innerHTML = `Round ${race.round} - ${race.Circuit.circuitName}`

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

    let scheduleList = `<div class="table-container"><table class="table tableSchedule text-center">
        <thead>
            <tr>
                <th scope="col" class="SessionLabel">Sessions:</th>
            </tr>
        </thead>
        <tbody>`

    events.forEach(event => {
        scheduleList += `<tr>
        <td class="tableScheduleTD"><span class="tableScheduleSession">${event.type}</span><br>${new Date(event.date + 'T' + event.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</td></tr>`
    })

    scheduleList += `</tbody>
        </table></div>`
    document.getElementById("schedule").innerHTML = scheduleList

}

async function getRaces(year) {
    if (year == new Date().getFullYear()) {
        let SEASON_RACE = "https://ergast.com/api/f1/" + year + ".json";

        try {
            const response = await fetch(SEASON_RACE);
            const data = await response.json();

            const races = data.MRData.RaceTable.Races

            let raceListHTML = ""
            let raceCount = 1
            races.forEach((race) => {
                let raceTime
                if (race.time) {
                    raceTime = race.time
                } else {
                    raceTime = '00:00:00'
                }

                if (new Date(race.date + 'T' + raceTime).getTime() < new Date().getTime()) {
                    linkWiki = race.url
                    raceListHTML += `<div class="card race-card ">
                              <div class="card-body">
                              <h5 class="card-title">${raceCount}° Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country} )</p>
                                <p class="card-text">${new Date(race.date).toLocaleDateString()}</p>
                                <p class="card-text">
                                <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${raceCount}" aria-expanded="false" aria-controls="collapseExample">
                                Show More
                              </button>
                            </p>

                            <div class="collapse" id="collapse${raceCount}">
                              <div class="card collapse-card card-body">
                                <table>
                                <tbody>
                                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#infoModal" onclick="showInfo('${encodeURIComponent(JSON.stringify(race))}')">
                                            Circuit Info
                                        </button>
                            
                                `
                    if (race.hasOwnProperty("Sprint")) {
                        raceListHTML += `<tr class="tr-non-sprint">
                <div class="grid text-center">
                <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#sprintModal" onclick="showSprint(${year},${raceCount})">
                                        Sprint Results
                                        </button>
                        </div> 
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#qualyModal" onclick="showQualy(${year},${raceCount})">
                                                                Qualifying Results
                                                                </button>
                        </div>
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults(${year},${raceCount})">
                                                                Race Results
                                                                </button>
                        </div>
                        
                        </div>
                            `
                    } else {
                        raceListHTML += `<tr class="tr-non-sprint">
                <div class="grid text-center">
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#qualyModal" onclick="showQualy(${year},${raceCount})">
                                                                Qualifying Results
                                                                </button>
                        </div>
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults(${year},${raceCount})">
                                                                Race Results
                                                                </button>
                        </div>
                        </div>
                                                        `
                    }



                } else {
                    raceListHTML += `<div class="card race-card ">
                              <div class="card-body">
                              <h5 class="card-title">${raceCount}° Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country} )</p>
                                <p class="card-text">${new Date(race.date).toLocaleDateString()}</p>
                                <p class="card-text">
                                <div class="timer">
                    <p class="card-text">Remaining time:</p>
                    <p class="card-text" id="countdown${raceCount}"></p>
                </div>
                <br>
                                <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${raceCount}" aria-expanded="false" aria-controls="collapseExample">
                                Show More
                              </button>
                            </p>

                            <div class="collapse" id="collapse${raceCount}">
                              <div class="card collapse-card card-body">
                                <table>
                                <tbody>
                                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#infoModal" onclick="showInfo('${encodeURIComponent(JSON.stringify(race))}')">
                                            Circuit Info
                                        </button>
                            
                                
                     <div class="row">
                <p class="card-text">
                    <button type="button" class="btn schedule btn-secondary" data-bs-toggle="modal" data-bs-target="#scheduleModal" onclick="showSchedule('${encodeURIComponent(JSON.stringify(race))}')">
                        See Schedule
                    </button>
                </p>
                
        </div>`;
                    startCountdown(raceCount, race);
                }

                raceListHTML += `               </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>`


                raceListHTML += "</div></div>"
                raceCount++
            });
            document.getElementById("race-list").innerHTML = raceListHTML
        } catch (error) {
            console.error(error)
        }
    } else {
        let SEASON_RACE = "https://ergast.com/api/f1/" + year + ".json";

        try {
            const response = await fetch(SEASON_RACE);
            const data = await response.json();

            const races = data.MRData.RaceTable.Races

            let raceListHTML = ""
            let raceCount = 1
            races.forEach((race) => {
                linkWiki = race.url
                raceListHTML += `<div class="card race-card ">
                              <div class="card-body">
                              <h5 class="card-title">${raceCount}° Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country} )</p>
                                <p class="card-text">${new Date(race.date).toLocaleDateString()}</p>
                                <p class="card-text">
                                <button class="btn btn-primary" type="button" data-bs-toggle="collapse" data-bs-target="#collapse${raceCount}" aria-expanded="false" aria-controls="collapseExample">
                                Show More
                              </button>
                            </p>

                            <div class="collapse" id="collapse${raceCount}">
                              <div class="card collapse-card card-body">
                                <table>
                                <tbody>
                                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#infoModal" onclick="showInfo('${encodeURIComponent(JSON.stringify(race))}')">
                                            Circuit Info
                                        </button>
                            
                                `
                if (race.hasOwnProperty("Sprint")) {
                    raceListHTML += `<tr class="tr-non-sprint">
                <div class="grid text-center">
                <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#sprintModal" onclick="showSprint(${year},${raceCount})">
                                        Sprint Results
                                        </button>
                        </div> 
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#qualyModal" onclick="showQualy(${year},${raceCount})">
                                                                Qualifying Results
                                                                </button>
                        </div>
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults(${year},${raceCount})">
                                                                Race Results
                                                                </button>
                        </div>
                        
                        </div>
                            `
                } else {
                    raceListHTML += `<tr class="tr-non-sprint">
                <div class="grid text-center">
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#qualyModal" onclick="showQualy(${year},${raceCount})">
                                                                Qualifying Results
                                                                </button>
                        </div>
                        <div class="g-col-6">
                        <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults(${year},${raceCount})">
                                                                Race Results
                                                                </button>
                        </div>
                        </div>
                                                        `
                }

                raceListHTML += `</tr>
            </tbody>
                                </table>
                              </div>
                            </div>`


                raceListHTML += "</div></div>"
                raceCount++
            });
            document.getElementById("race-list").innerHTML = raceListHTML
        } catch (error) {
            console.error(error)
        }
    }
}

function startCountdown(raceCount, race) {
    let countDownDate
    if (race.time) {
        countDownDate = new Date(race.date + 'T' + race.time).getTime()
    } else {
        countDownDate = new Date(race.date + 'T00:00:00').getTime()
    }

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

function ReshowResults() {
    var modalResults = new bootstrap.Modal(document.getElementById('resultModal'));
    modalResults.show()
}

async function showResults(year, raceCount) {
    let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/results.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].Results


        document.getElementById("showRaceModalLabel").innerHTML = `Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}`
        document.getElementById("resultModalLabel").innerHTML = `<a class="wikiLink" href="${data.MRData.RaceTable.Races[0].url}" target="_blank">Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}</a>`
        if (year >= 1996) {
            document.getElementById("displayRace").innerHTML = `
        <button type="button" class="button-close btn btn-secondary" data-bs-toggle="modal" data-bs-target="#showRaceModal" onclick="fullRace(${year},${raceCount})">
        Race Lap by Lap
    </button><br>`
        } else {
            document.getElementById("displayRace").innerHTML = ""
        }

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
                <td>
                  <div class="dropdown">
                    <a class="infoLink dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      ${result.Driver.givenName} ${result.Driver.familyName}
                    </a>
                    <ul class="dropdown-menu">
                    
                    
                    `
            if (year > 1995) { resultList += `<li><a class="dropdown-item" onclick="LapPerformance(${year}, ${raceCount}, '${result.Driver.driverId}')">Lap Performance</a></li>` }
            resultList += `<li><a class="dropdown-item" onclick="pitstop(${year}, ${raceCount}, '${result.Driver.driverId}')">PitStop</a></li>
                      <li><a class="dropdown-item" href="${result.Driver.url}" target="_blank">Wikipedia Link</a></li>
                    </ul>
                  </div>
                </td>
                <td>${result.number}</td>
                <td><a class="infoLink" href="${result.Constructor.url}" target="_blank">${result.Constructor.name}</a></td>
                <td>${result.laps}</td>`;

            if (result.hasOwnProperty("Time")) {
                resultList += `<td>${result.Time.time}</td>`;
            } else {
                resultList += `<td>${result.status}</td>`;
            }

            resultList += `<td>${posSymbol}</td>
              </tr>`;
        });

        resultList += `</tbody>
        </table></div> 
        `
        document.getElementById("result").innerHTML = resultList
        showFastestLap(year, raceCount)

    } catch (error) {
        console.error(error)
    }


}



async function showFastestLap(year, raceCount) {
    if (year >= 2004) {
        let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/fastest/1/results.json"
        try {
            const response = await fetch(URL);
            const data = await response.json();

            const results = data.MRData.RaceTable.Races[0].Results[0]

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
            document.getElementById("fastestLapLabel").innerHTML = ""
            document.getElementById("fastestLap").innerHTML = ""
            console.error(error)
        }

    } else {
        document.getElementById("fastestLapLabel").innerHTML = ""
        document.getElementById("fastestLap").innerHTML = ""

    }
}

async function championShow() {
    const year = document.getElementById("yearSelect").value
    const URL = `https://ergast.com/api/f1/${year}/driverStandings.json`

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
    const year = document.getElementById("yearSelect").value
    const URL = `https://ergast.com/api/f1/${year}/constructorStandings.json`

    if (year >= 1958) {
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
    } else {
        document.getElementById("constructorShow").innerHTML = "Constructor Championship wasn't already introducted"
    }


}


document.addEventListener('DOMContentLoaded', function () {
    let backgroundColor = localStorage.getItem('backgroundColor');

    document.body.style.backgroundColor = backgroundColor
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';

});

/*  MAPPA    */

var map = null;

async function getCountryCode(state) {
    if(state == "UK"){
        return "gb"
    }
    const response = await fetch(`https://restcountries.com/v3.1/name/${state}`);
    const data = await response.json();
    if (data && data.length > 0) {
        return data[0].cca2.toLowerCase();
    } else {
        throw new Error("Country not found");
    }
}

async function setFlagForState(state) {
    try {
        const countryCode = await getCountryCode(state);
        var flagElement = document.getElementById("stateFlag");

        flagElement.classList = "";

        flagElement.classList.add("flag-icon-" + countryCode);
        flagElement.classList.add("flag-icon")
        flagElement.style.fontSize = "50px";
    } catch (error) {
        console.error(error);
    }
}


function showInfo(race) {
    let circuit = JSON.parse(decodeURIComponent(race)).Circuit;

    setFlagForState(circuit.Location.country);

    document.getElementById("circuitLink").innerHTML = `<a class="infoLinkCircuit" href="${circuit.url}" target="_blank">${circuit.circuitName}</a>`

    document.getElementById("CircuitCountry").innerHTML = circuit.Location.country
    document.getElementById("CircuitLocality").innerHTML = circuit.Location.locality

    $('#infoModal').on('shown.bs.modal', function () {
        if (map !== null) {
            map.remove();
            map = null;
        }

        map = L.map("map").setView(
            [circuit.Location.lat, circuit.Location.long],
            14.5
        );

        L.tileLayer('https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
            maxZoom: 20,
            subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
        }).addTo(map);

        marker = L.marker([circuit.Location.lat, circuit.Location.long], { icon: customMarkerIcon }).addTo(map);

        var attributionLink = document.querySelector('.leaflet-control-attribution a');

        attributionLink.addEventListener('click', function (event) {
            event.preventDefault();
            window.open(attributionLink.href, '_blank');
        });
    });

    const customMarkerIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });
}



/*  RACE LAP BY LAP */

let RaceByLap
let lap = 0
let raceLeng = 0
let fastestLap = []

function convertTimeStringToMilliseconds(timeString) {
    if (timeString == Infinity) {
        return 100000000
    }
    const timeParts = timeString.split(':');
    const minutes = parseInt(timeParts[0]);

    const secondsParts = timeParts[1].split('.');
    const seconds = parseInt(secondsParts[0]);
    const milliseconds = parseInt(secondsParts[1]);

    const totalMilliseconds = (minutes * 60000) + (seconds * 1000) + milliseconds;
    return totalMilliseconds;
}

function createRaceByLapMatrix(drivers, raceLeng) {
    lap = 0
    fastestLap.push({
        time: Infinity,
        driver: null,
        lap: 0,
    })

    const RaceByLap = [];

    for (let i = 0; i < raceLeng; i++) {
        const lapData = [];
        for (let j = 0; j < drivers; j++) {
            lapData.push(0);
        }
        RaceByLap.push(lapData);
    }

    return RaceByLap;
}

const driverNamesMap = new Map(); // Map to store driver names

async function getFullDriverName(driverId) {
    if (driverNamesMap.has(driverId)) {
        // If the driver name is already stored in the map, retrieve it directly
        return driverNamesMap.get(driverId);
    } else {
        try {
            const response = await fetch(`https://ergast.com/api/f1/drivers/${driverId}.json`);
            const data = await response.json();
            const driver = data.MRData.DriverTable.Drivers[0];
            const familyName = driver.familyName;
            const givenName = driver.givenName;

            const fullName = `${givenName} ${familyName}`;
            driverNamesMap.set(driverId, fullName); // Store the driver name in the map

            return fullName;
        } catch (error) {
            console.error('Error:', error);
            return null;
        }
    }
}

async function fullRace(year, raceNum) {
    dimLap();
    const URL = `https://ergast.com/api/f1/${year}/${raceNum}/laps.json?limit=2000`;

    try {
        const response = await fetch(URL);
        const data = await response.json();

        let lapResults = data.MRData.RaceTable.Races[0].Laps;
        raceLeng = lapResults.length;
        let drivers = lapResults[0].Timings.length;
        RaceByLap = createRaceByLapMatrix(drivers, raceLeng);

        for (let lap = 0; lap < raceLeng; lap++) {
            for (let driver = 0; driver < lapResults[lap].Timings.length; driver++) {
                let obj = {
                    driverId: null,
                    time: null,
                    timeTOT: null,
                    position: null,
                };

                obj.position = lapResults[lap].Timings[driver].position;
                obj.time = convertTimeStringToMilliseconds(lapResults[lap].Timings[driver].time);
                obj.driverId = await getFullDriverName(lapResults[lap].Timings[driver].driverId);

                if (lap > 0 && RaceByLap[lap - 1][driver].driverId == obj.driverId) {
                    obj.timeTOT = convertTimeStringToMilliseconds(lapResults[lap].Timings[driver].time) + parseInt(RaceByLap[lap - 1][driver].timeTOT);
                } else if (lap > 0) {
                    for (let k = 0; k < lapResults[lap - 1].Timings.length; k++) {
                        if (RaceByLap[lap - 1][k].driverId == obj.driverId) {
                            obj.timeTOT = convertTimeStringToMilliseconds(lapResults[lap].Timings[driver].time) + parseInt(RaceByLap[lap - 1][k].timeTOT);
                            break;
                        }
                    }
                } else {
                    obj.timeTOT = convertTimeStringToMilliseconds(lapResults[lap].Timings[driver].time);
                }

                RaceByLap[lap][driver] = obj;
            }
        }
        printLap();
        ShowLap(year);
    } catch (error) {
        console.error(error);
    }
}



function printLap() {
    let currentLap = parseInt(lap) + 1
    document.getElementById("ShowLap").innerHTML = currentLap + " / " + raceLeng
}

function aumLap() {
    if (lap < raceLeng - 1) {
        lap++
        if (lap == raceLeng - 1) {
            const avantiButton = document.getElementById('avanti-button');
            avantiButton.disabled = true;
        }
        const indietroButton = document.getElementById('indietro-button');
        indietroButton.disabled = false;
        ShowLap()
    } else {
        const avantiButton = document.getElementById('avanti-button');
        avantiButton.disabled = true;
    }
    printLap()
}

function dimLap() {
    if (lap > 0) {
        lap--
        if (lap == 0) {
            const indietroButton = document.getElementById('indietro-button');
            indietroButton.disabled = true;
        }
        const avantiButton = document.getElementById('avanti-button');
        avantiButton.disabled = false;
        ShowLap()
    } else {
        const indietroButton = document.getElementById('indietro-button');
        indietroButton.disabled = true;
    }
    printLap()
}


function formatToTime(number) {
    var minutes = Math.floor(number / 60000);
    var seconds = Math.floor((number % 60000) / 1000);
    var milliseconds = Math.floor(number % 1000) / 1000;

    var formattedTime = "";

    if (minutes > 0) {
        formattedTime += minutes + ":";
        if (seconds < 10) {
            formattedTime += "0";
        }
    }

    formattedTime += seconds + milliseconds.toFixed(3).substr(1);

    return formattedTime;
}

function ShowLap(year) {

    let resultList = `<div class="table-container headerLapTable"><table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Position</th>
                <th scope="col">Driver</th>
                <th scope="col">Gap</th>
                <th scope="col">Gap from Leader</th>
            </tr>
        </thead>
        <tbody>
        <tr>
        <td>${RaceByLap[lap][0].position}</td>
        <td>${RaceByLap[lap][0].driverId}</td>
        <td>-</td>
        <td>-</td>
        </tr>`

    let lap_fastestLap = {
        time: RaceByLap[lap][0].time,
        lap: parseInt(lap) + 1,
        driver: RaceByLap[lap][0].driverId
    }

    for (let i = 1; i < RaceByLap[lap].length; i++) {
        if (RaceByLap[lap][i] == 0) {
            break;
        }

        if (lap_fastestLap.time > RaceByLap[lap][i].time) {
            lap_fastestLap.time = RaceByLap[lap][i].time
            lap_fastestLap.lap = parseInt(lap) + 1
            lap_fastestLap.driver = RaceByLap[lap][i].driverId
        }

        let diff_leader = formatToTime((parseInt(RaceByLap[lap][0].timeTOT) - parseInt(RaceByLap[lap][i].timeTOT)) * -1)
        let diff = formatToTime((parseInt(RaceByLap[lap][i - 1].timeTOT) - parseInt(RaceByLap[lap][i].timeTOT)) * -1)
        resultList += `<tr>
                                <td>${RaceByLap[lap][i].position}</td>
                                <td>${RaceByLap[lap][i].driverId}</td>
                                <td> + ${diff}</td>
                                <td> + ${diff_leader}</td>

                    </tr>`
    }

    if (fastestLap[fastestLap.length - 1].time > lap_fastestLap.time && (fastestLap[fastestLap.length - 1].lap <= lap_fastestLap.lap)) {
        fastestLap.push(lap_fastestLap)


        document.getElementById("lap_FastestLap").innerHTML = `  <div class="row">
                                                                            <div class="col">
                                                                                <svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stopwatch" viewBox="0 0 16 16">
                                                                                    <path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"/>
                                                                                    <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>
                                                                                </svg>
                                                                            </div>
                                                                            <div class="col">
                                                                                ${fastestLap[fastestLap.length - 1].driver}
                                                                            </div>
                                                                            <div class="col">
                                                                                ${formatToTime(fastestLap[fastestLap.length - 1].time)}
                                                                            </div>
                                                                            <div class="col">
                                                                                ${fastestLap[fastestLap.length - 1].lap}
                                                                            </div>
                                                                        </div>
                                                                        `
    } else if (fastestLap[fastestLap.length - 1].lap > lap_fastestLap.lap) {
        for (let i = 0; i < fastestLap.length; i++) {
            if (fastestLap[i].lap > lap + 1) {
                fastestLap.splice(i, 1)
            }


            document.getElementById("lap_FastestLap").innerHTML = `  <div class="row">
                                                                            <div class="col">
                                                                                <svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-stopwatch" viewBox="0 0 16 16">
                                                                                    <path d="M8.5 5.6a.5.5 0 1 0-1 0v2.9h-3a.5.5 0 0 0 0 1H8a.5.5 0 0 0 .5-.5V5.6z"/>
                                                                                    <path d="M6.5 1A.5.5 0 0 1 7 .5h2a.5.5 0 0 1 0 1v.57c1.36.196 2.594.78 3.584 1.64a.715.715 0 0 1 .012-.013l.354-.354-.354-.353a.5.5 0 0 1 .707-.708l1.414 1.415a.5.5 0 1 1-.707.707l-.353-.354-.354.354a.512.512 0 0 1-.013.012A7 7 0 1 1 7 2.071V1.5a.5.5 0 0 1-.5-.5zM8 3a6 6 0 1 0 .001 12A6 6 0 0 0 8 3z"/>
                                                                                </svg>
                                                                            </div>
                                                                            <div class="col">
                                                                                ${fastestLap[fastestLap.length - 1].driver}
                                                                            </div>
                                                                            <div class="col">
                                                                                ${formatToTime(fastestLap[fastestLap.length - 1].time)}
                                                                            </div>
                                                                            <div class="col">
                                                                                ${fastestLap[fastestLap.length - 1].lap}
                                                                            </div>
                                                                        </div>
                                                                        `

        }
    }
    if (year < 2004) {
        document.getElementById("lap_FastestLap").innerHTML = ""
    }


    resultList += `</tbody>
        </table></div>`


    document.getElementById("resultLap").innerHTML = resultList
}


/*  QUALY   */
async function showQualy(year, raceCount) {
    const improved = "rgb(22, 217, 0)"
    const not_improved = "rgb(255, 230, 1)"
    const same = "white"
    const fastest = "rgb(255, 0, 183)"


    let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/qualifying.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].QualifyingResults

        let driver = []
        results.forEach((result) => {
            console.log(result)
            let Q1 = Infinity
            let Q2 = Infinity
            let Q3 = Infinity

            if (result.hasOwnProperty("Q1") && result.Q1 != "") {
                Q1 = result.Q1
            }

            if (result.hasOwnProperty("Q2") && result.Q2 != "") {
                Q2 = result.Q2
            }

            if (result.hasOwnProperty("Q3") && result.Q3 != "") {
                Q3 = result.Q3
            }

            let name = result.Driver.givenName + " " + result.Driver.familyName

            let Q2_bg
            let Q3_bg

            if (convertTimeStringToMilliseconds(Q2) < convertTimeStringToMilliseconds(Q1)) {
                Q2_bg = improved
            } else if (convertTimeStringToMilliseconds(Q2) > convertTimeStringToMilliseconds(Q1)) {
                Q2_bg = not_improved
            } else {
                Q2_bg = same
            }

            if (convertTimeStringToMilliseconds(Q3) < convertTimeStringToMilliseconds(Q2) && convertTimeStringToMilliseconds(Q3) < convertTimeStringToMilliseconds(Q1)) {
                Q3_bg = improved
            } else if (convertTimeStringToMilliseconds(Q3) == convertTimeStringToMilliseconds(Q2) && convertTimeStringToMilliseconds(Q3) == convertTimeStringToMilliseconds(Q1)) {
                Q3_bg = same
            } else {
                Q3_bg = not_improved
            }

            let obj = {
                position: result.position,
                name: name,
                number: result.number,
                constructor: result.Constructor.name,
                Q1: Q1,
                Q2: Q2,
                Q3: Q3,
                Q1_bg: improved,
                Q2_bg: Q2_bg,
                Q2_bg_p: Q2_bg,
                Q3_bg: Q3_bg
            }

            driver.push(obj)

        })
        console.log(driver)

        document.getElementById("qualyModalLabel").innerHTML = `Qualifying<br>Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}`

        let resultList = `<div class="table-container"><table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Position</th>
                <th scope="col">Driver</th>
                <th scope="col">Number</th>
                <th scope="col">Constructor</th>
                <th scope="col">Q1</th>
                <th scope="col">Q2</th>
                <th scope="col">Q3</th>
            </tr>
        </thead>
        <tbody>`

        Q1_min = driver[0]
        driver[0].Q1_bg = fastest

        Q2_min = driver[0]
        driver[0].Q2_bg = fastest

        driver[0].Q3_bg = fastest

        for (let i = 1; i < driver.length; i++) {
            if (convertTimeStringToMilliseconds(driver[i].Q1) < convertTimeStringToMilliseconds(Q1_min.Q1)) {
                driver[Q1_min.position - 1].Q1_bg = improved
                Q1_min = driver[i]
                driver[i].Q1_bg = fastest
            }

            if (convertTimeStringToMilliseconds(driver[i].Q2) < convertTimeStringToMilliseconds(Q2_min.Q2)) {
                driver[Q2_min.position - 1].Q2_bg = Q2_min.Q2_bg_p
                Q2_min = driver[i]
                driver[i].Q2_bg = fastest
            }
        }

        for (let i = 0; i < driver.length; i++) {
            if (driver[i].Q1 == Infinity) {
                driver[i].Q1_bg = "rgba(0,0,0,0)"
                driver[i].Q1 = "-"
            }
            if (driver[i].Q2 == Infinity) {
                driver[i].Q2_bg = "rgba(0,0,0,0)"
                driver[i].Q2 = "-"
            }
            if (driver[i].Q3 == Infinity) {
                driver[i].Q3_bg = "rgba(0,0,0,0)"
                driver[i].Q3 = "-"
            }
        }

        for (let i = 0; i < driver.length; i++) {
            resultList += `<tr>
                                <td>${driver[i].position}</td>
                                <td>${driver[i].name}</td>
                                <td>${driver[i].number}</td>
                                <td>${driver[i].constructor}</td>
                                <td style="background: ${driver[i].Q1_bg} !important">${driver[i].Q1}</td>
                                <td style="background: ${driver[i].Q2_bg} !important">${driver[i].Q2}</td>
                                <td style="background: ${driver[i].Q3_bg} !important">${driver[i].Q3}</td>
                            </tr>`;
        }

        console.log(driver)

        resultList += `</tbody>
        </table></div>`
        document.getElementById("printQualy").innerHTML = resultList

    } catch (error) {
        console.error(error)
    }


}


async function LapPerformance(year, race, driver) {
    var modalResults = new bootstrap.Modal(document.getElementById('chartLapModal'));
    modalResults.show();

    displayLapChartWithPitstops(year, race, driver);

}


function formatTime(timeInSeconds) {
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const milliseconds = Math.round((timeInSeconds % 1) * 1000);

    return `${minutes}:${String(seconds).padStart(2, '0')}.${String(milliseconds).padStart(3, '0')}`;
}

async function fetchLapAndPitstopData(year, race, driver) {
    const lapApiUrl = `https://ergast.com/api/f1/${year}/${race}/drivers/${driver}/laps.json?limit=2000`;
    const pitstopApiUrl = `https://ergast.com/api/f1/${year}/${race}/drivers/${driver}/pitstops.json?limit=2000`;

    const lapResponse = await fetch(lapApiUrl);
    const pitstopResponse = await fetch(pitstopApiUrl);

    const lapData = await lapResponse.json();
    const pitstopData = await pitstopResponse.json();

    return {
        laps: lapData.MRData.RaceTable.Races[0].Laps,
        pitstops: pitstopData.MRData.RaceTable.Races[0].PitStops,
    };
}

function createLapChart(lapTimes, pitstops) {
    function timeToSeconds(timeString) {
        const timeParts = timeString.split(":");
        const minutes = parseInt(timeParts[0]);
        const secondsWithMilliseconds = parseFloat(timeParts[1]);
        return (minutes * 60) + secondsWithMilliseconds;
    }

    const lapNumbers = lapTimes.map(lap => lap.number);
    const lapTimesInSeconds = lapTimes.map(lap => timeToSeconds(lap.Timings[0].time));

    const pitstopLaps = pitstops.map(pitstop => pitstop.lap);
    const pitstopTimesInSeconds = pitstops.map(pitstop => pitstop.duration);

    const pitstopBubbleData = pitstopLaps.map((lapNumber, index) => ({
        x: lapNumber,
        y: lapTimesInSeconds[lapNumber - 1],
        r: pitstopTimesInSeconds[index]
    }));
    console.log(pitstopBubbleData)

    const canvas = document.getElementById("lapChart");
    const ctx = canvas.getContext("2d");

    if (Chart.getChart("lapChart")) {
        Chart.getChart("lapChart").destroy();
    }

    new Chart('lapChart', {
        type: 'line',
        data: {
            labels: lapNumbers,
            datasets: [{
                label: "Lap Times",
                type: 'line',
                data: lapTimesInSeconds,
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
                fill: false
            },
            {
                label: "Pitstops",
                type: 'bubble',
                data: pitstopBubbleData,
                borderColor: 'rgba(255, 99, 132, 1)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)', // Customize the bubble background color
                borderWidth: 1,
                pointRadius: 8, // Customize the bubble size
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: "Lap Number"
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: "Time (minutes:seconds.milliseconds)"
                    },
                    ticks: {
                        callback: value => formatTime(value)
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: (context) => {
                            const datasetIndex = context.datasetIndex;
                            const dataValue = context.parsed.y;
                            let tooltipLabel = "";

                            if (datasetIndex === 0) {
                                const lapTimeInSeconds = lapTimesInSeconds[context.dataIndex];
                                tooltipLabel = `Lap: ${context.parsed.x + 1} - Lap Time: ${formatTime(lapTimeInSeconds)}`;
                                console.log(context)
                            } else {
                                tooltipLabel = `Lap: ${context.raw.x} - Pitstop Duration: ${context.raw.r}`;
                            }

                            return tooltipLabel;
                        }
                    }
                }
            }
        }
    });
}

async function pitstop(year, race, driver) {
    var modalResults = new bootstrap.Modal(document.getElementById('pitModal'));
    modalResults.show();
    const apiUrl = `https://ergast.com/api/f1/${year}/${race}/drivers/${driver}/pitstops.json?limit=2000`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    const results = data.MRData.RaceTable.Races[0].PitStops;

    document.getElementById("pitModalLabel").innerHTML = `<a class="wikiLink" href="${data.MRData.RaceTable.Races[0].url}" target="_blank">Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}</a>`

    let resultList = `<div class="table-container"><table class="table table-striped text-center">
        <thead>
            <tr>
                <th scope="col">Lap</th>
                <th scope="col">Time</th>
            </tr>
        </thead>
        <tbody>`
    results.forEach((result) => {
        resultList += `<tr>
            <td>${result.lap}</td>
            <td>${result.duration}</td>
          </tr>`;
    });

    resultList += `</tbody>
    </table></div> 
    `
    document.getElementById("pitResult").innerHTML = resultList;
}

async function displayLapChartWithPitstops(year, race, driver) {
    const { laps, pitstops } = await fetchLapAndPitstopData(year, race, driver);
    createLapChart(laps, pitstops);
}


async function showSprint(year, raceCount) {
    let URL = "https://ergast.com/api/f1/" + year + "/" + raceCount + "/sprint.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].SprintResults
        console.log(results)


        document.getElementById("sprintModalLabel").innerHTML = `<a class="wikiLink" href="${data.MRData.RaceTable.Races[0].url}" target="_blank">Round ${data.MRData.RaceTable.Races[0].round}: ${data.MRData.RaceTable.Races[0].raceName}</a>`

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
                <td>
                  <div class="dropdown">
                    <a class="infoLink dropdown-toggle" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                      ${result.Driver.givenName} ${result.Driver.familyName}
                    </a>
                    <ul class="dropdown-menu">
                        <li><a class="dropdown-item" onclick="pitstop(${year}, ${raceCount}, '${result.Driver.driverId}')" data-bs-dismiss="modal">PitStop</a></li>
                        <li><a class="dropdown-item" href="${result.Driver.url}" target="_blank">Wikipedia Link</a></li>
                    </ul>
                  </div>
                </td>
                <td>${result.number}</td>
                <td><a class="infoLink" href="${result.Constructor.url}" target="_blank">${result.Constructor.name}</a></td>
                <td>${result.laps}</td>`;

            if (result.hasOwnProperty("Time")) {
                resultList += `<td>${result.Time.time}</td>`;
            } else {
                resultList += `<td>${result.status}</td>`;
            }

            resultList += `<td>${posSymbol}</td>
              </tr>`;
        });

        resultList += `</tbody>
        </table></div> 
        `
        document.getElementById("sprintResult").innerHTML = resultList

    } catch (error) {
        console.error(error)
    }


}
