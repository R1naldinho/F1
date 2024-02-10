const lights = Array.prototype.slice.call(document.querySelectorAll('.light-strip'));
const time = document.querySelector('.time');
const best = document.querySelector('.best span');
let bestTime = Number(localStorage.getItem('best')) || Infinity;
let started = false;
let lightsOutTime = 0;
let raf;
let timeout;


const infoModal = new bootstrap.Modal(document.getElementById('infoBackdrop'));
const statsModal = new bootstrap.Modal(document.getElementById('statsBackdrop'));

document.addEventListener('keydown', function (event) {
    if (event.code === 'Space') {
        if (infoModal._isShown || statsModal._isShown) {
            infoModal.hide();
            statsModal.hide();
            document.activeElement.blur();
        }
    }
});

function showInfo() {
    infoModal.show();
}




window.onload = function () {
    showInfo()
}

function resetRecord() {
    localStorage.setItem('best', Infinity);
    bestTime = Number(localStorage.getItem('best')) || Infinity;
    localStorage.setItem('attempt', 0);
    localStorage.setItem('jumpStart', 0);
    localStorage.setItem('improvedRecord', 0);
    location.reload()
}

function playAudio(percorso) {
    var audio = new Audio(percorso);
    audio.play();
}

function showStats() {
    statsModal.show();
    let recordTime = Number(localStorage.getItem('best')) || Infinity;
    if (recordTime == Infinity) {
        recordTime = '-'
    } else {
        recordTime = formatTime(recordTime)
    }
    let tabella = `<table class="table notActivate">
    <tbody>
      <tr>
        <th scope="row">Record:</th>
        <td>${recordTime}</td>
      </tr>
      <tr>
        <th scope="row">Attemps:</th>
        <td>${localStorage.getItem('attempt')}</td>
      </tr>
      <tr>
        <th scope="row">Jump Start:</th>
        <td>${localStorage.getItem('jumpStart')}</td>
      </tr>
      <tr>
        <th scope="row">Improved Record:</th>
        <td>${localStorage.getItem('improvedRecord')}</td>
      </tr>
      <tr>
    </tr>
    </tbody>
  </table>`

    document.getElementById("stampaStats").innerHTML = tabella
}

function formatTime(time) {
    time = Math.round(time);
    let outputTime = time / 1000;
    if (time < 10000) {
        outputTime = '0' + outputTime;
    }
    while (outputTime.length < 6) {
        outputTime += '0';
    }
    return outputTime;
}

if (bestTime != Infinity) {
    best.textContent = formatTime(bestTime);
}

function start() {
    let attempt = localStorage.getItem('attempt')
    attempt++
    localStorage.setItem('attempt', attempt)
    for (const light of lights) {
        light.classList.remove('on');
    }

    time.textContent = '00.000';
    time.classList.remove('anim');

    lightsOutTime = 0;
    let lightsOn = 0;
    let previusLight = 0
    const lightsStart = performance.now();

    function frame(now) {
        const toLight = Math.floor((now - lightsStart) / 1000) + 1;
        if (toLight > lightsOn) {
            if (previusLight != toLight) {
                previusLight = toLight
                playAudio("./sound/secondo.mp3")
            }
            for (const light of lights.slice(0, toLight)) {
                light.classList.add('on');
            }
        }

        if (toLight < 5) {
            raf = requestAnimationFrame(frame);

        }
        else {
            const delay = Math.random() * 4000 + 1000;
            timeout = setTimeout(() => {
                for (const light of lights) {
                    light.classList.remove('on');
                }
                playAudio("./sound/via.mp3")
                lightsOutTime = performance.now();
            }, delay);
        }
    }

    raf = requestAnimationFrame(frame);
}

function end(timeStamp) {
    cancelAnimationFrame(raf);
    clearTimeout(timeout);

    if (!lightsOutTime) {
        time.textContent = "Jump start!";
        let jumpStart = localStorage.getItem('jumpStart')
        jumpStart++
        localStorage.setItem('jumpStart', jumpStart)
        time.classList.add('anim');
        return;
    }
    else {
        const thisTime = timeStamp - lightsOutTime;
        time.textContent = formatTime(thisTime);
        if (thisTime < bestTime) {
            bestTime = thisTime;
            best.textContent = time.textContent;
            localStorage.setItem('best', thisTime);
            let improvedRecord = localStorage.getItem('improvedRecord')
            improvedRecord++
            localStorage.setItem('improvedRecord', improvedRecord)
        }

        time.classList.add('anim');
    }

    infoModal.hide();
    statsModal.hide();
}

function tap(event) {

    if (event.target && !event.target.classList.contains('enableTap') && event.key !== ' ') return;

    let timeStamp = performance.now();

    if (!started) {
        started = true;
        start();
    } else {
        end(timeStamp);
        started = false;
    }

    infoModal.hide();
    statsModal.hide();
}


addEventListener('touchend', function (event) {
    if (event.touches.length === 0) {
        tap();
    }
});

addEventListener('mousedown', event => {
    if (event.button === 0) tap(event);
}, { passive: false });

addEventListener('keydown', event => {
    if (event.key == ' ') tap(event);
}, { passive: false });



document.addEventListener('DOMContentLoaded', function () {
    let backgroundColor = localStorage.getItem('backgroundColor');
    document.body.style.backgroundColor = backgroundColor
    
    document.body.style.fontSize = localStorage.getItem("FontSize") + 'px';
});