window.onload = function () {
    lastRace()
    nextRace()
}

function SaveChangesColor() {
    var backgroundPreview = document.querySelector(".background-preview");
    var computedStyle = getComputedStyle(backgroundPreview);
    var selectedColor = computedStyle.backgroundColor;

    localStorage.setItem('backgroundColor', selectedColor);
    document.body.style.backgroundColor = selectedColor;
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';
    document.getElementById("FontPreview").innerHTML = `Font Size - ${document.body.style.fontSize}`
}

document.addEventListener('DOMContentLoaded', function () {
    let backgroundColor = localStorage.getItem('backgroundColor');

    document.body.style.backgroundColor = backgroundColor
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';
    document.getElementById("FontPreview").innerHTML = `Font Size - ${document.body.style.fontSize}`
});


const last_URL = "https://ergast.com/api/f1/current/last.json"
const next_URL = "https://ergast.com/api/f1/current/next.json"

async function lastRace() {
    try {
        const response = await fetch(last_URL);
        const data = await response.json();

        const race = data.MRData.RaceTable.Races[0]

        let raceListHTML = ""
        linkWiki = race.url
        raceListHTML += `<div class="card race-card ">
                              <div class="card-body">
                              <h5 class="card-title">Last Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country})</p>
                                <p class="card-text">${new Date(race.date + 'T' + race.time).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                <p class="card-text">
                                    
                                </p>
                                <p class="card-text">
                                    <button type="button" class="btn btn-secondary" data-bs-toggle="modal" data-bs-target="#resultModal" onclick="showResults()">
                                        See Results
                                    </button>
                                </p>
                                </div>
                                </div`

        document.getElementById("lastRace").innerHTML = raceListHTML
    } catch (error) {
        console.error(error)
    }
}

async function nextRace() {
    try {
        const response = await fetch(next_URL);
        const data = await response.json();

        const race = data.MRData.RaceTable.Races[0]

        let raceListHTML = ""
        linkWiki = race.url
        
        let raceTime
        if(race.time){
            raceTime = race.time
        }else{      
            raceTime = '00:00:00'
        }

        raceListHTML += `<div class="card race-card race-cardBottom">
                              <div class="card-body">
                              <h5 class="card-title">Next Round - <a href="${linkWiki}" target="_blank" class="wikiLink">${race.raceName}</a></h5>
                                <p class="card-text">${race.Circuit.circuitName} ( ${race.Circuit.Location.locality} - ${race.Circuit.Location.country})</p>
                                <p class="card-text">${new Date(race.date + 'T' + raceTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</p>
                                <p class="card-text">
                                    
                                </p>
                                <div class="row">
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
                                        <p class="card-text" id="countdown"></p>
                                    </div>
                                </div>
                            </div>`;

        startCountdown(race);

        raceListHTML += "</div></div>"
        document.getElementById("nextRace").innerHTML = raceListHTML
    } catch (error) {
        console.error(error)
    }
}

function startCountdown(race) {
    let countDownDate
    if(race.time){
        countDownDate = new Date(race.date + 'T' + race.time).getTime()
    }else{      
        countDownDate = new Date(race.date + 'T00:00:00').getTime()
    }

    let x = setInterval(function () {

        let now = new Date().getTime();

        let distance = countDownDate - now;

        let days = Math.floor(distance / (1000 * 60 * 60 * 24));
        let hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById("countdown").innerHTML = days + "d " + hours + "h " + minutes + "m " + seconds + "s ";

        if (distance < 0) {
            clearInterval(x);
            alert(race.raceName + "HAS STARTED!");
            document.getElementById("countdown" + raceCount + "").innerHTML = "race live!"
        }
    }, 1000);
}

async function showResults() {
    let year = new Date().getFullYear()
    let URL = "https://ergast.com/api/f1/current/last/results.json"
    try {
        const response = await fetch(URL);
        const data = await response.json();

        const results = data.MRData.RaceTable.Races[0].Results


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
            let posSimbol


            if (result.grid != 0) {
                let posGained = result.grid - result.position

                if (posGained < 0) {
                    posSimbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="red" class="bi bi-chevron-down" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
              </svg> ${-1 * posGained}`
                } else if (posGained == 0) {
                    posSimbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="gray" class="bi bi-dash-lg" viewBox="0 0 16 16">
                <path fill-rule="evenodd" d="M2 8a.5.5 0 0 1 .5-.5h11a.5.5 0 0 1 0 1h-11A.5.5 0 0 1 2 8Z"/>
              </svg>`
                } else {
                    posSimbol = `<svg xmlns="https://www.w3.org/2000/svg" width="16" height="16" fill="green" class="bi bi-chevron-up" viewBox="0 0 16 16">
            <path fill-rule="evenodd" d="M7.646 4.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 5.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"/>
          </svg> ${posGained}`
                }
            } else {
                posSimbol = `Started from Pitlane`
            }

            resultList += `<tr>
                                <td>${result.positionText}</td>
                                <td>${result.points}</td>
                                <td>${result.Driver.givenName} ${result.Driver.familyName}</td>
                                <td>${result.number}</td>
                                <td>${result.Constructor.name}</td>
                                <td>${result.laps}</td>`
            if (result.hasOwnProperty("Time")) {
                resultList += `<td>${result.Time.time}</td>`
            } else {
                resultList += `<td>${result.status}</td>`
            }

            resultList += `<td>${posSimbol}</td>
                            </tr>`
        })
        resultList += `</tbody>
        </table></div>`
        document.getElementById("result").innerHTML = resultList
        showFastestLap(year)

    } catch (error) {
        console.error(error)
    }

}

async function showFastestLap() {
    let URL = "https://ergast.com/api/f1/current/last/fastest/1/results.json"
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
            <td>${results.Driver.givenName} ${results.Driver.familyName}</td>
            <td>${results.number}</td>
            <td>${results.Constructor.name}</td>
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

function increaseFontSize() {
    var modal = document.getElementById("backgroundModal");
    var computedFontSize = window.getComputedStyle(modal).fontSize;
    var currentFontSize = parseFloat(computedFontSize);

    if (currentFontSize < 30) {
        var newFontSize = currentFontSize + 1;

        let button = document.getElementById("decrease-font-size")
        button.disabled = false

        modal.style.fontSize = newFontSize + 'px';
        localStorage.setItem("FontSize", newFontSize)
    } else {
        let button = document.getElementById("increase-font-size")
        button.disabled = true
    }
    document.getElementById("FontPreview").innerHTML = `Font Size - ${modal.style.fontSize}`
}

function decreaseFontSize() {
    var modal = document.getElementById("backgroundModal");
    var computedFontSize = window.getComputedStyle(modal).fontSize;
    var currentFontSize = parseFloat(computedFontSize);

    if (currentFontSize > 10) {
        var newFontSize = currentFontSize - 1;

        let button = document.getElementById("increase-font-size")
        button.disabled = false

        modal.style.fontSize = newFontSize + 'px';
        localStorage.setItem("FontSize", newFontSize)
    } else {
        let button = document.getElementById("decrease-font-size")
        button.disabled = true
    }
    document.getElementById("FontPreview").innerHTML = `Font Size - ${modal.style.fontSize}`
}



function resetBackground() {
    document.getElementById("team-select").selectedIndex = 0

    var backgroundPreview = document.querySelector(".background-preview");
    backgroundPreview.style.backgroundColor = "#fffefe";
    SaveChangesColor()

    document.body.style.fontSize = 15 + 'px'
    localStorage.setItem("FontSize", 15)
    var modal = document.getElementById("backgroundModal")
    modal.style.fontSize = 15 + 'px'
    document.getElementById("FontPreview").innerHTML = `Font Size - ${modal.style.fontSize}`

    let button = document.getElementById("decrease-font-size")
    button.disabled = false

    button = document.getElementById("increase-font-size")
    button.disabled = false
}

function changeTeamColor() {
    var teamSelect = document.getElementById("team-select");
    var selectedTeam = teamSelect.value;

    var backgroundPreview = document.querySelector(".background-preview");


    /*
    
    Light #FFFEFE
    Dark #342D2D
    Mercedes	#00D2BE	0,210,90
    Ferrari	#DC0000	220,0,0
    Red Bull Racing	#0600EF	6,0,239
    Alpine	#0090FF	0,144,255
    Haas	#FFFFFF	255,255,255
    Aston Martin	#006F62	0,111,98
    AlphaTauri	#2B4562	43,69,98
    McLaren	#FF8700	255,135,0
    Alfa Romeo Racing	#900000	144,0,0
    Williams	#005AFF	0,90,255

    */
    switch (selectedTeam) {
        case "light":
            backgroundPreview.style.backgroundColor = "#FFFEFE";
            break;
        case "dark":
            backgroundPreview.style.backgroundColor = "#342D2D";
            break;
        case "ferrari":
            backgroundPreview.style.backgroundColor = "#DC0000";
            break;
        case "mercedes":
            backgroundPreview.style.backgroundColor = "#00D2BE";
            break;
        case "redbull":
            backgroundPreview.style.backgroundColor = "#0600EF";
            break;
        case "mclaren":
            backgroundPreview.style.backgroundColor = "#FF8700";
            break;
        case "alpine":
            backgroundPreview.style.backgroundColor = "#0090FF";
            break;
        case "alphatauri":
            backgroundPreview.style.backgroundColor = "#2B4562";
            break;
        case "alfaromeo":
            backgroundPreview.style.backgroundColor = "#900000";
            break;
        case "astonmartin":
            backgroundPreview.style.backgroundColor = "#006F62";
            break;
        case "williams":
            backgroundPreview.style.backgroundColor = "#005AFF";
            break;
        case "haas":
            backgroundPreview.style.backgroundColor = "#FFFFFF";
            break;
        default:
            backgroundPreview.style.backgroundColor = "#FFFEFE";
            break;
    }
}


function updateColor(event) {
    var colorPicker = document.getElementById("color-picker");
    var selectedColor = colorPicker.value;

    var backgroundPreview = document.querySelector(".background-preview");
    backgroundPreview.style.backgroundColor = selectedColor;
}

