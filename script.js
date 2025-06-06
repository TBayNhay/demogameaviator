const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 1280;
canvas.height = 480;

let speedX = 1.1;
let speedY = 0.05;
let x = 0;
let y = canvas.height;
let dotPath = [];
let counter = 1.0;
let randomStop = Math.random() * (10 - 0.1) + 0.8;
let cashedOut = false;
let placedBet = false;
let isFlying = false;
let autoBet = false;
let betHistory = [];
let betTimer = 8;
let canBet = true;
let lastFrameTime = performance.now();

const image = new Image();
image.src = './img/aviator_jogo.png';

let balanceAmount = document.getElementById('balance-amount');
let calculatedBalanceAmount = 123456789;
balanceAmount.textContent = calculatedBalanceAmount.toLocaleString('vi-VN') + ' VND';

let betButton = document.getElementById('bet-button');
betButton.textContent = 'Đặt Cược';

let lastCounters = document.getElementById('last-counters');
let counterDepo = [1.01, 18.45, 2.02, 5.21, 1.22, 1.25, 2.03, 4.55, 65.11, 1.03];
let inputBox = document.getElementById('bet-input');
let increaseBetButton = document.getElementById('increase-bet');
let autoBetCheckbox = document.getElementById('auto-bet');
let messageField = document.getElementById('message');
let betTimerBar = document.getElementById('bet-timer-bar');
let betHistoryTable = document.getElementById('bet-history-table').getElementsByTagName('tbody')[0];

inputBox.value = '2.500';
messageField.textContent = 'Chờ vòng tiếp theo';

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseFormattedNumber(str) {
    return parseFloat(str.replace(/\./g, '')) || 0;
}

function updateCounterDepo() {
    lastCounters.innerHTML = counterDepo.map(i => {
        let classNameForCounter = i < 2 ? 'blueBorder' : i < 10 ? 'purpleBorder' : 'burgundyBorder';
        return `<p class="${classNameForCounter}">${i.toFixed(2)}x</p>`;
    }).join('');
}

function updateBetHistory(betAmount, multiplier, result) {
    const now = new Date();
    const time = now.toLocaleTimeString('vi-VN');
    const row = betHistoryTable.insertRow(0);
    row.innerHTML = `
        <td>${time}</td>
        <td>${betAmount.toLocaleString('vi-VN')} VND</td>
        <td>${multiplier ? multiplier.toFixed(2) + 'x' : '-'}</td>
        <td>${result}</td>
    `;
    betHistory.unshift({ time, betAmount, multiplier, result });
    if (betHistory.length > 10) {
        betHistory.pop();
        betHistoryTable.deleteRow(-1);
    }
}

function updateBetTimer(deltaTime) {
    if (!isFlying && canBet) {
        betTimer -= deltaTime / 1000;
        if (betTimer < 0) betTimer = 0;
        betTimerBar.style.width = `${(betTimer / 8) * 100}%`;
        if (betTimer <= 0) {
            canBet = false;
            messageField.textContent = 'Hết thời gian đặt cược';
            document.getElementById('bet-timer').style.display = 'none';
        }
    }
}

inputBox.addEventListener('input', () => {
    let value = inputBox.value.replace(/[^\d]/g, '');
    if (value) {
        inputBox.value = formatNumber(parseInt(value));
    }
});

inputBox.addEventListener('keydown', e => {
    if (['-', '+', 'e'].includes(e.key)) {
        e.preventDefault();
    }
});

increaseBetButton.addEventListener('click', () => {
    let currentBet = parseFormattedNumber(inputBox.value);
    currentBet += 2500;
    inputBox.value = formatNumber(currentBet);
});

autoBetCheckbox.addEventListener('change', () => {
    autoBet = autoBetCheckbox.checked;
});

let animationId;

let takeoffTime = 1.2;
let takeoffElapsed = 0;

function draw(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateCounterDepo();
    updateBetTimer(deltaTime);

    if (!isFlying && !canBet && counter === 1.0) {
        isFlying = true;
        takeoffElapsed = 0;
    }

    if (isFlying) {
        counter += deltaTime * 0.001 * 0.1;
        document.getElementById('counter').textContent = counter.toFixed(2) + 'x';

        let currentSpeedY = (takeoffElapsed < takeoffTime) ?
            speedY * Math.min(takeoffElapsed += deltaTime / 1000, 1) :
            speedY;

        x += speedX * (0.98 + 0.02 * Math.sin(counter));
        y -= currentSpeedY * (1 + 0.2 * Math.sin(x / 40));
        if (y < 50) y = 50;

        dotPath.push({ x, y });

        if (counter >= randomStop) {
            isFlying = false;
            if (placedBet && !cashedOut) {
                updateBetHistory(parseFormattedNumber(inputBox.value), null, `Thua ${inputBox.value} VND`);
                placedBet = false;
                betButton.textContent = 'Đặt Cược';
                messageField.textContent = 'Máy bay rơi! Đường dẫn đứt.';
                setBetInputEnabled(true);
            }
        }
    }

    const canvasOffsetX = canvas.width / 2 - x;
    const canvasOffsetY = canvas.height / 2 - y;
    ctx.save();
    ctx.translate(canvasOffsetX, canvasOffsetY);

    const pathLength = isFlying ? dotPath.length : Math.min(20, dotPath.length);
    for (let i = 1; i < pathLength; i++) {
        ctx.beginPath();
        ctx.strokeStyle = '#dc3545';
        ctx.moveTo(dotPath[dotPath.length - pathLength + i - 1].x, dotPath[dotPath.length - pathLength + i - 1].y);
        ctx.lineTo(dotPath[dotPath.length - pathLength + i].x, dotPath[dotPath.length - pathLength + i].y);
        ctx.stroke();
    }

    ctx.beginPath();
    ctx.fillStyle = '#dc3545';
    ctx.lineWidth = 5;
    ctx.arc(x, y, 1, 0, 2 * Math.PI);
    ctx.fill();

    ctx.drawImage(image, x - 42, y - 117, 278, 128);
    ctx.restore();

    if (!isFlying && counter >= randomStop) {
        // 🔥 Gửi kết quả về tool Python
        fetch('http://127.0.0.1:5050/api/report_result', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                result: parseFloat(counter.toFixed(2)),
                timestamp: Date.now()
            })
        }).catch(err => console.warn('Không thể gửi kết quả tới tool:', err));

        cancelAnimationFrame(animationId);

        counterDepo.unshift(parseFloat(counter.toFixed(2)));
        if (counterDepo.length > 10) counterDepo.pop();

        setTimeout(() => {
            startRound();
        }, 3000);
        return;
    }

    animationId = requestAnimationFrame(draw);
}

betButton.addEventListener('click', () => {
    if (placedBet && canBet) {
        cancelBet();
    } else if (placedBet) {
        cashOut();
    } else {
        placeBet();
    }
});

function setBetInputEnabled(enabled) {
    inputBox.disabled = !enabled;
    increaseBetButton.disabled = !enabled;
}

function placeBet() {
    const betAmount = parseFormattedNumber(inputBox.value);
    if (placedBet || !inputBox.value || isNaN(betAmount) || isFlying || betAmount > calculatedBalanceAmount || !canBet) {
        messageField.textContent = canBet ? 'Chờ vòng tiếp theo' : 'Hết thời gian đặt cược';
        return;
    }

    if (!isFlying && canBet) {
        if (betAmount && betAmount <= calculatedBalanceAmount) {
            calculatedBalanceAmount -= betAmount;
            balanceAmount.textContent = calculatedBalanceAmount.toLocaleString('vi-VN') + ' VND';
            betButton.textContent = 'Hủy Cược';
            placedBet = true;
            messageField.textContent = 'Đã đặt cược';
            updateBetHistory(betAmount, null, 'Đang chờ');
            setBetInputEnabled(false);
        } else {
            messageField.textContent = 'Số dư không đủ để đặt cược';
        }
    } else {
        messageField.textContent = 'Chờ vòng tiếp theo';
    }
}

function cancelBet() {
    if (placedBet && canBet && !isFlying) {
        const betAmount = parseFormattedNumber(inputBox.value);
        calculatedBalanceAmount += betAmount;
        balanceAmount.textContent = calculatedBalanceAmount.toLocaleString('vi-VN') + ' VND';
        placedBet = false;
        betButton.textContent = 'Đặt Cược';
        messageField.textContent = 'Đã hủy cược';
        setBetInputEnabled(true);
        if (betHistoryTable.rows.length > 0 && betHistory[0]?.result === 'Đang chờ') {
            betHistoryTable.deleteRow(0);
            betHistory.shift();
        }
    }
}

function cashOut() {
    if (cashedOut || !placedBet) {
        messageField.textContent = 'Chờ vòng tiếp theo';
        return;
    }

    if (isFlying && counter < randomStop) {
        const betAmount = parseFormattedNumber(inputBox.value);
        const winnings = Math.floor(betAmount * counter);
        calculatedBalanceAmount += winnings;
        balanceAmount.textContent = calculatedBalanceAmount.toLocaleString('vi-VN') + ' VND';
        cashedOut = true;
        placedBet = false;
        betButton.textContent = 'Đặt Cược';
        messageField.textContent = `Rút tiền thành công: ${winnings.toLocaleString('vi-VN')} VND`;
        updateBetHistory(betAmount, counter, `Thắng ${winnings.toLocaleString('vi-VN')} VND`);
        setBetInputEnabled(true);
    } else {
        messageField.textContent = 'Không thể rút tiền lúc này';
    }
}

function startRound() {
    counter = 1.0;
    x = 4;
    y = canvas.height - 6;
    dotPath = [];
    cashedOut = false;
    placedBet = false;
    isFlying = false;
    canBet = true;
    betTimer = 8;
    betTimerBar.style.width = '100%';
    randomStop = Math.random() * (10 - 0.1) + 0.8;
    messageField.textContent = 'Chờ vòng tiếp theo';
    setBetInputEnabled(true);
    document.getElementById('bet-timer').style.display = 'block';
    lastFrameTime = performance.now();
    animationId = requestAnimationFrame(draw);
}

startRound();
