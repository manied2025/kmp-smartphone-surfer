const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const highscoreEl = document.getElementById("highscore");
const livesEl = document.getElementById("lives");
const restartButton = document.getElementById("restartButton");

const groundY = 330;
const gravity = 0.9;

const keys = {
  left: false,
  right: false,
};

let score = 0;
let highscore = Number(localStorage.getItem("streetSweeperHighscore")) || 0;
let lives = 3;
let gameOver = false;
let distance = 0;

const player = {
  x: 100,
  y: groundY - 70,
  width: 48,
  height: 70,
  speed: 4.8,
  velocityY: 0,
  onGround: true,
};

const collectibles = [];
const obstacles = [];

highscoreEl.textContent = String(highscore);

function randomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function resetGame() {
  score = 0;
  lives = 3;
  gameOver = false;
  distance = 0;
  player.x = 100;
  player.y = groundY - player.height;
  player.velocityY = 0;
  player.onGround = true;
  collectibles.length = 0;
  obstacles.length = 0;
  updateHud();
}

function updateHud() {
  scoreEl.textContent = String(score);
  livesEl.textContent = String(lives);
  highscoreEl.textContent = String(highscore);
}

function spawnCollectible() {
  const size = randomBetween(18, 28);
  collectibles.push({
    x: canvas.width + randomBetween(0, 300),
    y: groundY - size,
    width: size,
    height: size,
    speed: randomBetween(3.5, 5.5),
  });
}

function spawnObstacle() {
  const width = randomBetween(50, 95);
  const height = randomBetween(45, 90);
  obstacles.push({
    x: canvas.width + randomBetween(150, 350),
    y: groundY - height,
    width,
    height,
    speed: randomBetween(4, 6.3),
    passed: false,
  });
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update() {
  if (gameOver) {
    return;
  }

  distance += 1;

  if (Math.random() < 0.03) {
    spawnCollectible();
  }

  if (Math.random() < 0.02) {
    spawnObstacle();
  }

  if (keys.left) {
    player.x -= player.speed;
  }
  if (keys.right) {
    player.x += player.speed;
  }

  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  player.velocityY += gravity;
  player.y += player.velocityY;

  if (player.y >= groundY - player.height) {
    player.y = groundY - player.height;
    player.velocityY = 0;
    player.onGround = true;
  }

  for (let i = collectibles.length - 1; i >= 0; i -= 1) {
    const item = collectibles[i];
    item.x -= item.speed;

    if (intersects(player, item)) {
      score += 10;
      collectibles.splice(i, 1);
      continue;
    }

    if (item.x + item.width < 0) {
      collectibles.splice(i, 1);
    }
  }

  for (let i = obstacles.length - 1; i >= 0; i -= 1) {
    const obstacle = obstacles[i];
    obstacle.x -= obstacle.speed;

    if (!obstacle.passed && obstacle.x + obstacle.width < player.x) {
      obstacle.passed = true;
      score += 5;
    }

    if (intersects(player, obstacle)) {
      obstacles.splice(i, 1);
      lives -= 1;

      if (lives <= 0) {
        lives = 0;
        gameOver = true;

        if (score > highscore) {
          highscore = score;
          localStorage.setItem("streetSweeperHighscore", String(highscore));
        }
      }
      continue;
    }

    if (obstacle.x + obstacle.width < 0) {
      obstacles.splice(i, 1);
    }
  }

  score += 0.03;
  score = Math.floor(score);

  if (score > highscore) {
    highscore = score;
  }

  updateHud();
}

function drawPlayer() {
  // Körper
  ctx.fillStyle = "#fbc531";
  ctx.fillRect(player.x + 10, player.y + 14, 28, 42);

  // Kopf
  ctx.fillStyle = "#f5f6fa";
  ctx.beginPath();
  ctx.arc(player.x + 24, player.y + 12, 10, 0, Math.PI * 2);
  ctx.fill();

  // Besen
  ctx.strokeStyle = "#e1b12c";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(player.x + 40, player.y + 20);
  ctx.lineTo(player.x + 48, player.y + 52);
  ctx.stroke();

  ctx.fillStyle = "#7f8fa6";
  ctx.fillRect(player.x + 42, player.y + 50, 16, 7);
}

function drawBackground() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Himmel
  ctx.fillStyle = "#273c75";
  ctx.fillRect(0, 0, canvas.width, groundY - 70);

  // Häuser
  ctx.fillStyle = "#353b48";
  for (let i = 0; i < 12; i += 1) {
    const x = (i * 95 - (distance * 0.35) % 95);
    const h = 70 + (i % 3) * 15;
    ctx.fillRect(x, groundY - 70 - h, 70, h);
  }

  // Straße
  ctx.fillStyle = "#2f3640";
  ctx.fillRect(0, groundY, canvas.width, canvas.height - groundY);

  // Bürgersteig
  ctx.fillStyle = "#718093";
  ctx.fillRect(0, groundY - 10, canvas.width, 10);

  // Fahrbahn-Markierung
  ctx.fillStyle = "#fbc531";
  for (let i = 0; i < 14; i += 1) {
    const dashX = (i * 80 - (distance * 2.5) % 80);
    ctx.fillRect(dashX, groundY + 38, 40, 6);
  }
}

function drawCollectibles() {
  collectibles.forEach((item) => {
    ctx.fillStyle = "#44bd32";
    ctx.beginPath();
    ctx.arc(item.x + item.width / 2, item.y + item.height / 2, item.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#dcdde1";
    ctx.fillRect(item.x + item.width * 0.35, item.y + item.height * 0.2, item.width * 0.3, item.height * 0.6);
  });
}

function drawObstacles() {
  obstacles.forEach((obstacle) => {
    ctx.fillStyle = "#8c7ae6";
    ctx.beginPath();
    ctx.ellipse(
      obstacle.x + obstacle.width / 2,
      obstacle.y + obstacle.height / 2,
      obstacle.width / 2,
      obstacle.height / 2,
      0,
      0,
      Math.PI * 2,
    );
    ctx.fill();

    ctx.fillStyle = "#2f3640";
    ctx.font = "14px sans-serif";
    ctx.fillText("Müll", obstacle.x + obstacle.width * 0.25, obstacle.y + obstacle.height * 0.6);
  });
}

function drawOverlay() {
  if (!gameOver) {
    return;
  }

  ctx.fillStyle = "rgba(0, 0, 0, 0.55)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#f5f6fa";
  ctx.font = "bold 46px sans-serif";
  ctx.fillText("Spiel vorbei", canvas.width / 2 - 140, canvas.height / 2 - 20);

  ctx.font = "24px sans-serif";
  ctx.fillText(`Punkte: ${score}`, canvas.width / 2 - 60, canvas.height / 2 + 24);
  ctx.fillText("Drücke Enter oder 'Neues Spiel'", canvas.width / 2 - 170, canvas.height / 2 + 62);
}

function loop() {
  update();
  drawBackground();
  drawCollectibles();
  drawObstacles();
  drawPlayer();
  drawOverlay();
  requestAnimationFrame(loop);
}

function jump() {
  if (!player.onGround || gameOver) {
    return;
  }

  player.velocityY = -16;
  player.onGround = false;
}

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft") {
    keys.left = true;
  }
  if (event.key === "ArrowRight") {
    keys.right = true;
  }
  if (event.key === "ArrowUp" || event.key === " ") {
    jump();
  }
  if (event.key === "Enter" && gameOver) {
    resetGame();
  }
});

document.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft") {
    keys.left = false;
  }
  if (event.key === "ArrowRight") {
    keys.right = false;
  }
});

restartButton.addEventListener("click", resetGame);

resetGame();
loop();
