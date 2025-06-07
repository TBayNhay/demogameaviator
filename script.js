// Predictable crash injection let roundNumber = 0; const secretKey = "s3cr3t_k3y";

function generatePredictableCrash(secret, round) { const hash = CryptoJS.HmacSHA256(round.toString(), secret).toString(); const hex = parseInt(hash.substring(0, 8), 16); const crashPoint = (hex % 1000) / 100 + 1.0; return Math.min(crashPoint, 10.0); }

const script = document.createElement('script'); script.src = "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js"; script.onload = () => { startRound(); }; document.head.appendChild(script);

const canvas = document.getElementById('canvas'); const ctx = canvas.getContext('2d');

canvas.width = 1280; canvas.height = 480;

let speedX = 1.1; let speedY = 0.05; let x = 0; let y = canvas.height; let dotPath = []; let counter = 1.0; let randomStop; let cashedOut = false; let placedBet = false; let isFlying = false; let autoBet = false; let betHistory = []; let betTimer = 8; let canBet = true; let lastFrameTime = performance.now();

const image = new Image(); image.src = './img/aviator_jogo.png';

let balanceAmount = document.getElementById('balance-amount'); let calculatedBalanceAmount = 123456789; balanceAmount.textContent = calculatedBalanceAmount.toLocaleString('vi-VN') + ' VND';

let betButton = document.getElementById('bet-button'); betButton.textContent = 'Đặt Cược';

let lastCounters = document.getElementById('last-counters'); let counterDepo = [1.01, 18.45, 2.02, 5.21, 1.22, 1.25, 2.03, 4.55, 65.11, 1.03]; let inputBox = document.getElementById('bet-input'); let increaseBetButton = document.getElementById('increase-bet'); let autoBetCheckbox = document.getElementById('auto-bet'); let messageField = document.getElementById('message'); let betTimerBar = document.getElementById('bet-timer-bar'); let betHistoryTable = document.getElementById('bet-history-table').getElementsByTagName('tbody')[0];

inputBox.value = '2.500'; messageField.textContent = 'Chờ vòng tiếp theo';

function formatNumber(num) { return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function parseFormattedNumber(str) { return parseFloat(str.replace(/./g, '')) || 0; }

function updateCounterDepo() { lastCounters.innerHTML = counterDepo.map(i => { let classNameForCounter = i < 2 ? 'blueBorder' : i < 10 ? 'purpleBorder' : 'burgundyBorder'; return <p class="${classNameForCounter}">${i.toFixed(2)}x</p>; }).join(''); }

function updateBetHistory(betAmount, multiplier, result) { const now = new Date(); const time = now.toLocaleTimeString('vi-VN'); const row = betHistoryTable.insertRow(0); row.innerHTML = <td>${time}</td> <td>${betAmount.toLocaleString('vi-VN')} VND</td> <td>${multiplier ? multiplier.toFixed(2) + 'x' : '-'}</td> <td>${result}</td>; betHistory.unshift({ time, betAmount, multiplier, result }); if (betHistory.length > 10) { betHistory.pop(); betHistoryTable.deleteRow(-1); } }

// Giữ lại toàn bộ phần game, animation, đặt cược... // Không cần sửa gì thêm, chỉ thay đổi randomStop trong startRound

function startRound() { counter = 1.0; x = 4; y = canvas.height - 6; dotPath = []; cashedOut = false; placedBet = false; isFlying = false; canBet = true; betTimer = 8; betTimerBar.style.width = '100%'; randomStop = generatePredictableCrash(secretKey, ++roundNumber); messageField.textContent = 'Chờ vòng tiếp theo'; setBetInputEnabled(true); document.getElementById('bet-timer').style.display = 'block'; lastFrameTime = performance.now(); animationId = requestAnimationFrame(draw); }

// KHÔNG gọi startRound() ở cuối file!

