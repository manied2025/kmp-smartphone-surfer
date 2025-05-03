
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const lanes = [80, 180, 280]; // 3 Bahnen
let laneIndex = 1;
let y = 500;
let jump = false;
let jumpY = 0;
let energy = 100;
let gameRunning = false;

// Figurenplatzhalter
const phone = {
    width: 40,
    height: 60,
    color: "#000"
};

function drawPhone() {
    let phoneY = y - jumpY;
    ctx.fillStyle = phone.color;
    ctx.fillRect(lanes[laneIndex] - phone.width / 2, phoneY, phone.width, phone.height);
}

function drawEnergyBar() {
    ctx.fillStyle = "gray";
    ctx.fillRect(10, 10, 100, 10);
    ctx.fillStyle = "limegreen";
    ctx.fillRect(10, 10, energy, 10);
    ctx.strokeStyle = "black";
    ctx.strokeRect(10, 10, 100, 10);
}

function updateGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPhone();
    drawEnergyBar();

    if (jumpY > 0) {
        jumpY -= 4;
    }

    energy -= 0.05;
    if (energy <= 0) {
        endGame();
    }

    if (gameRunning) {
        requestAnimationFrame(updateGame);
    }
}

function endGame() {
    gameRunning = false;
    canvas.style.display = "none";
    document.getElementById("game-over-screen").style.display = "block";
}

document.getElementById("start-button").onclick = () => {
    document.getElementById("start-screen").style.display = "none";
    canvas.style.display = "block";
    gameRunning = true;
    requestAnimationFrame(updateGame);
};

document.getElementById("restart-button").onclick = () => {
    location.reload();
};

// Tastatursteuerung
document.addEventListener("keydown", (e) => {
    if (!gameRunning) return;
    if (e.key === "ArrowLeft" && laneIndex > 0) laneIndex--;
    if (e.key === "ArrowRight" && laneIndex < lanes.length - 1) laneIndex++;
    if (e.key === "ArrowUp" || e.key === " ") {
        if (jumpY === 0) jumpY = 80;
    }
});
