async function fetchDriverStandings(year) {
    const response = await fetch(`https://ergast.com/api/f1/${year}/driverStandings/1.json`);
    const data = await response.json();
    return data.MRData.StandingsTable.StandingsLists[0].DriverStandings;
}

function retrieveDataFromLocalStorage() {
    const storedYear = parseInt(localStorage.getItem('lastYear'));
    const lastYear = new Date().getFullYear() - 1;

    if (storedYear && (storedYear == lastYear) && localStorage.getItem('surnameMap') != null) {
        const storedMap = JSON.parse(localStorage.getItem('surnameMap'));
        const surnameMap = new Map(storedMap);

        return surnameMap;
    }else{
        localStorage.setItem('lastYear', lastYear)
    }

    return null;
}

async function fetchDataAndCreateSurnameMap() {
    const surnameMap = new Map();
    const lastYear = parseInt(new Date().getFullYear() - 1);

    for (let year = lastYear; year >= 1950; year--) {
        const driverStandings = await fetchDriverStandings(year);
        const surnames = driverStandings.map(driver => driver.Driver.familyName.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
        const regex = new RegExp(surnames.join('|'), 'i');
        surnameMap.set(year, regex.toString());
    }

    localStorage.setItem('lastYear', lastYear);
    localStorage.setItem('surnameMap', JSON.stringify([...surnameMap]));

    return surnameMap;
}

async function controlLocalStorage() {
    const storedData = retrieveDataFromLocalStorage();

    if (storedData) {
        const surnameMap = storedData;
        return surnameMap
    } else {
        const surnameMap = await fetchDataAndCreateSurnameMap();
        return surnameMap
    }
}

let surnameMap
window.onload = function () {
    localStorage.setItem("lastYear", parseInt(new Date().getFullYear - 1))
    controlLocalStorage().then((result) => {
        surnameMap = result
    });

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-secondary', 'position-absolute', 'top-50', 'start-50', 'translate-middle');
    button.textContent = 'Start';
    button.addEventListener('click', startGame);
    button.id = 'StartButton'

    document.body.appendChild(button);

}

let year

function startGame() {
    year = parseInt(localStorage.getItem('lastYear'))

    const button = document.getElementById("StartButton")
    button.remove()

    const timer = document.createElement('div');
    timer.id = 'timer';
    timer.textContent = '00:00';

    const span = document.createElement('span');
    span.id = "totProgBar";
    let lastYear = new Date().getFullYear() - 1
    span.textContent = `${(lastYear - year)}/${lastYear - 1949}`;

    const progressBar = document.createElement('div');
    progressBar.id = "progressbar";
    progressBar.classList.add('progress');
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuenow', '0');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');

    const progressBarInner = document.createElement('div');
    progressBarInner.classList.add('progress-bar', 'bg-danger');
    progressBarInner.style.width = '0%';

    progressBar.appendChild(progressBarInner);

    const divTimer = document.getElementById("div-timer");
    divTimer.appendChild(timer);

    
    const divProgress = document.getElementById("div-progress");
    divProgress.appendChild(span);
    const br = document.createElement('br')
    divProgress.appendChild(br);
    divProgress.appendChild(progressBar);


    startTimer()
    createCard(year)
}

function createCard(year) {
    const card = document.createElement('div');
    card.id = "champCard"
    card.classList.add('card', 'mb-3');

    const cardBody = document.createElement('div');
    cardBody.classList.add('card-body');

    const cardTitle = document.createElement('h5');
    cardTitle.classList.add('card-title');
    cardTitle.textContent = year;

    const form = document.createElement('form');

    const formGroup = document.createElement('div');
    formGroup.classList.add('mb-3');

    const label = document.createElement('label');
    label.classList.add('form-label');
    label.textContent = 'Who was the champion of that year?';

    const input = document.createElement('input');
    input.id = "champName"
    input.addEventListener('keydown', function (event) {
        if (event.keyCode === 13) {
            event.preventDefault();
            verifyRegex();
        }
    });

    input.setAttribute('autocomplete', 'off');
    input.setAttribute('type', 'text');
    input.classList.add('form-control');

    const button = document.createElement('button');
    button.setAttribute('type', 'button');
    button.classList.add('btn', 'btn-secondary');
    button.textContent = 'Send';

    button.addEventListener('click', verifyRegex);

    formGroup.appendChild(label);
    formGroup.appendChild(input);

    form.appendChild(formGroup);
    form.appendChild(button);

    cardBody.appendChild(cardTitle);
    cardBody.appendChild(form);

    card.appendChild(cardBody);

    const divCard = document.getElementById("div-card");
    divCard.appendChild(card);
    input.focus();
}

function verifyRegex() {
    const regexString = surnameMap.get(year);
    const pattern = regexString.slice(1, -2);
    const flags = regexString.slice(-1);
    const regex = new RegExp(pattern, flags);

    const userInput = document.getElementById("champName")
    const name = userInput.value

    if (!regex.test(name)) {
        gameOver("Wrong Answer", year)
    } else {
        lastYear = new Date().getFullYear()
        document.getElementById("totProgBar").innerHTML = `${(lastYear - year)}/${lastYear - 1950}`

        const progressBar = document.getElementsByClassName("progress-bar")[0];
        progressBar.setAttribute('aria-valuenow', Math.floor((lastYear - year) / (lastYear - 1950)) * 100);
        progressBar.style.width = (lastYear - year) / (lastYear - 1950) * 100 + "%";
        if (year > 1950) {
            year--
            const card = document.getElementById("champCard")
            card.remove()
            createCard(year)
        } else {
            gameOver(`Congratulations You are a real F1 fan!`)
        }

    }
}

function gameOver(message, year= -1) {
    stopTimer()

    if(year != -1){
        message += `\n${surnameMap.get(year).slice(1, surnameMap.get(year).length - 2)}`
    }

    const card = document.getElementById("champCard")
    card.remove()

    const text = document.createElement('pre');
    text.classList.add('position-absolute', 'top-50', 'start-50', 'translate-middle', 'h4-like');
    text.textContent = message;
    document.body.appendChild(text);

    setTimeout(function () {
        location.reload();
    }, 5000);
}

let timerInterval;
let startTime;
let elapsedTime = 0;

function startTimer() {
    startTime = Date.now() - elapsedTime;
    timerInterval = setInterval(updateTimer, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    elapsedTime = Date.now() - startTime;
    const elapsedMinutes = Math.floor(elapsedTime / 60000);
    const elapsedSeconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById("timer").textContent = `${formatTime(elapsedMinutes)}:${formatTime(elapsedSeconds)}`;

    const champRecord = localStorage.getItem("champRecord")
    if (elapsedTime < champRecord) {
        localStorage.setItem("champRecord", elapsedTime)
        localStorage.setItem("champRecordTime", `${formatTime(elapsedMinutes)}:${formatTime(elapsedSeconds)}`)
    }
}

function updateTimer() {
    const currentTime = Date.now();
    elapsedTime = currentTime - startTime;
    const elapsedMinutes = Math.floor(elapsedTime / 60000);
    const elapsedSeconds = Math.floor((elapsedTime % 60000) / 1000);
    document.getElementById("timer").textContent = `${formatTime(elapsedMinutes)}:${formatTime(elapsedSeconds)}`;
}

function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

document.addEventListener('DOMContentLoaded', function () {
    let backgroundColor = localStorage.getItem('backgroundColor');

    document.body.style.backgroundColor = backgroundColor
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';

});
