//Countdown
var targetDate = new Date("October 12, 2026 07:00:00").getTime();
var countdown = setInterval(function () {

    var now = new Date().getTime();
    var distance = targetDate - now;
    var days = Math.floor(distance / (1000 * 60 * 60 * 24));
    var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
    var seconds = Math.floor((distance % (1000 * 60)) / 1000);
    if (days < 10) { days = "0" + days; }
    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }
    document.getElementById("days").innerText = days;
    document.getElementById("hours").innerText = hours;
    document.getElementById("minutes").innerText = minutes;
    document.getElementById("seconds").innerText = seconds;

    if (distance < 0) {
        clearInterval(countdown);
        document.querySelector(".countdown-container").innerHTML = "<h3>EVENT STARTED</h3>";
    }
}, 1000);

//Navbar

const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
const hamburger = document.getElementById('nav-hamburger');
const mainNav = document.getElementById('main-nav');
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => link.classList.remove('active'));
            const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
            if (active) active.classList.add('active');
        }
    });
}, { threshold: 0.4 });
sections.forEach(s => observer.observe(s));
hamburger.addEventListener('click', () => {
    mainNav.classList.toggle('nav-open');
});
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        mainNav.classList.remove('nav-open');
    });
});


//Carousel
const carousels = document.querySelectorAll('.reusable-carousel');
carousels.forEach(carousel => {

    const track = carousel.querySelector('.carousel-track');
    const nextBtn = carousel.querySelector('.next');
    const prevBtn = carousel.querySelector('.prev');

    nextBtn.addEventListener('click', () => {
        const slideWidth = track.clientWidth;
        track.scrollBy({
            left: slideWidth,
            behavior: 'smooth'
        });
    });

    prevBtn.addEventListener('click', () => {
        const slideWidth = track.clientWidth;
        track.scrollBy({
            left: -slideWidth,
            behavior: 'smooth'
        });
    });
});
//----------------------------------------------------------------------------------------//

//event logic

let liveIds = [0];
let nextIds = [0];
let endedIds = [0];


async function loadSchedule() {
    try {
        const response = await fetch('./events.json');
        const events = await response.json();
        render(events);
    } catch (error) {
        console.error("Error loading the schedule:", error);
    }
}
function render(events) {
    const list = document.getElementById('schedule-list');

    const sorted = [...events].sort((a, b) => {
        let scoreA = liveIds.includes(a.id) ? 0 : (nextIds.includes(a.id) ? 1 : (endedIds.includes(a.id) ? 3 : 2));
        let scoreB = liveIds.includes(b.id) ? 0 : (nextIds.includes(b.id) ? 1 : (endedIds.includes(b.id) ? 3 : 2));
        if (scoreA === scoreB) return a.id - b.id;
        return scoreA - scoreB;
    });
    list.innerHTML = sorted.map(ev => {
        let label = "Upcoming";
        let css = "status-upcoming";

        if (liveIds.includes(ev.id)) { label = "ON-GOING"; css = "status-live"; }
        else if (nextIds.includes(ev.id)) { label = "NEXT"; css = "status-next"; }
        else if (endedIds.includes(ev.id)) { label = "ENDED"; css = "status-ended"; }

        return `
            <div class="event-row ${css}">
                <div class="time-col" style="color: white; font-weight: bold;">${ev.time}</div>
                <div class="status-col" style="text-transform: uppercase; letter-spacing: 1px;">${label}</div>
                <div class="desc-col">
                    <div style="font-size: 1.1rem; font-weight: 600; color: white;">${ev.title}</div>
                    <div style="font-size: 0.9rem; color: #999; margin-top: 4px;">${ev.desc}</div>
                </div>
                <div class="venue-col">${ev.venue}</div>
            </div>
        `;
    }).join('');
}
loadSchedule();

// LEADERBOARD //

let lbLiveIds = [];

async function loadLeaderboard() {
    try {
        const response = await fetch('./leaderboard.json');
        const teams = await response.json();
        renderLeaderboard(teams);
    } catch (error) {
        console.error("Error loading the leaderboard:", error);
    }
}


function computeRanks(teams) {
    const withPoints = teams.filter(t => t.points > 0);
    const noPoints = teams.filter(t => t.points === 0);
    withPoints.sort((a, b) => b.points - a.points);
    let currentRank = 1;
    withPoints.forEach((team, i) => {
        if (i > 0 && team.points === withPoints[i - 1].points) {
            team._computedRank = withPoints[i - 1]._computedRank;
        } else {
            team._computedRank = currentRank;
        }
        currentRank++;
    });
    noPoints.forEach(team => { team._computedRank = 0; });
    return [...withPoints, ...noPoints];
}
function renderLeaderboard(teams) {
    const list = document.getElementById('lb-list');
    const sorted = computeRanks(teams);
    list.innerHTML = sorted.map((entry) => {
        const rank = entry._computedRank;
        const isLive = lbLiveIds.includes(entry.id);
        const liveBadge = isLive
            ? `<span class="lb-live-badge"><span class="lb-live-dot"></span>Live Update</span>`
            : '';
        const badgeClass =
            rank === 1 ? 'lb-rank-1' :
                rank === 2 ? 'lb-rank-2' :
                    rank === 3 ? 'lb-rank-3' : 'lb-rank-other';
        const rowClass =
            rank === 1 ? 'lb-row-top1' :
                rank === 2 ? 'lb-row-top2' :
                    rank === 3 ? 'lb-row-top3' : '';
        const memberNames = entry.members.join(', ');
        const rankDisplay = rank === 0 ? '—' : rank;
        const pointsDisplay = entry.points > 0 ? entry.points : '—';
        return `
            <div class="lb-row ${rowClass}">
                <div class="lb-rank-col">
                    <span class="lb-rank-badge ${badgeClass}">${rankDisplay}</span>
                </div>
                <div class="lb-team-col">
                    <span class="lb-team-name">${entry.team}${liveBadge}</span>
                </div>
                <div class="lb-score-col">
                    <span class="lb-score-val">${pointsDisplay}</span>
                </div>
            </div>
        `;
    }).join('');
}
loadLeaderboard();


//  EVENT LEADERBOARD
let elbLiveIds = [];
let elbCurrentIndex = 0;
let elbTotal = 0;

async function loadEventLeaderboard() {
    try {
        const response = await fetch('./event-leaderboard.json');
        const events = await response.json();
        renderEventLeaderboard(events);
    } catch (error) {
        console.error("Error loading the event leaderboard:", error);
    }
}
function renderEventLeaderboard(events) {
    const track = document.getElementById('elb-track');
    const dotsBox = document.getElementById('elb-dots');
    elbTotal = events.length;
    elbCurrentIndex = 0;
    track.innerHTML = events.map(ev => {
        const isLive = elbLiveIds.includes(ev.id);
        const liveBadge = isLive
            ? `<span class="elb-live-badge"><span class="elb-live-dot"></span>Live</span>`
            : '';
        const medalClasses = ['elb-medal-1', 'elb-medal-2', 'elb-medal-3'];
        const rowClasses = ['elb-rank-1', 'elb-rank-2', 'elb-rank-3'];
        const ordinals = ['1st', '2nd', '3rd'];
        const podiumRows = [1, 2, 3].map(r => {
            const entry = ev.results.find(res => res.rank === r);
            const hasData = entry && entry.school && entry.school.trim() !== '';
            const rowClass = hasData ? rowClasses[r - 1] : 'elb-rank-empty';
            const medalClass = hasData ? medalClasses[r - 1] : 'elb-medal-empty';
            const schoolHtml = hasData
                ? `<span class="elb-school-name">${entry.school}</span>`
                : `<span class="elb-school-name elb-school-empty">—</span>`;
            const pointsHtml = hasData && entry.points > 0
                ? `<span class="elb-points-val">${entry.points}</span>`
                : `<span class="elb-points-empty">—</span>`;
            return `
                <div class="elb-podium-row ${rowClass}">
                    <span class="elb-medal ${medalClass}">${ordinals[r - 1]}</span>
                    ${schoolHtml}
                    ${pointsHtml}
                </div>`;
        }).join('');
        return `
            <div class="elb-card" data-event-id="${ev.id}">
                <div>
                    <h2 class="elb-event-title">${ev.eventTitle}${liveBadge}</h2>
                    <p class="elb-results-label">Top 3 Results</p>
                </div>
                <div class="elb-podium">${podiumRows}</div>
            </div>`;
    }).join('');
    dotsBox.innerHTML = events.map((_, i) =>
        `<span class="elb-dot${i === 0 ? ' active' : ''}" data-index="${i}"></span>`
    ).join('');
    dotsBox.querySelectorAll('.elb-dot').forEach(dot => {
        dot.addEventListener('click', () => elbGoTo(parseInt(dot.dataset.index)));
    });
    elbUpdatePosition();
}
function elbGoTo(index) {
    elbCurrentIndex = (index + elbTotal) % elbTotal;
    elbUpdatePosition();
}
function elbUpdatePosition() {
    const track = document.getElementById('elb-track');
    if (!track) return;
    track.style.transform = `translateX(-${elbCurrentIndex * 100}%)`;
    document.querySelectorAll('.elb-dot').forEach((dot, i) => {
        dot.classList.toggle('active', i === elbCurrentIndex);
    });
}
document.getElementById('elb-prev').addEventListener('click', () => {
    elbGoTo(elbCurrentIndex - 1);
});
document.getElementById('elb-next').addEventListener('click', () => {
    elbGoTo(elbCurrentIndex + 1);
});
loadEventLeaderboard();