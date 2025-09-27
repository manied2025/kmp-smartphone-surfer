const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const highScoreEl = document.getElementById('highScore');

const world = {
  width: canvas.width,
  height: canvas.height,
  groundY: canvas.height * 0.72,
  gravity: 0.9,
  speed: 6,
};

const keys = new Set();
let lastTimestamp = 0;

const state = {
  running: false,
  score: 0,
  highScore: Number(localStorage.getItem('streetSweeperHighScore') || 0),
  smallTrash: [],
  bigTrash: [],
  sweepCooldown: 0,
  spawnTimers: {
    small: 0,
    big: 0,
  },
};

highScoreEl.textContent = state.highScore;

class Player {
  constructor() {
    this.reset();
  }

  reset() {
    this.width = 80;
    this.height = 110;
    this.x = world.width * 0.18;
    this.y = world.groundY - this.height;
    this.vy = 0;
    this.isJumping = false;
    this.isSweeping = false;
    this.sweepTimer = 0;
  }

  update(delta) {
    const moveLeft = keys.has('ArrowLeft') || keys.has('a');
    const moveRight = keys.has('ArrowRight') || keys.has('d');
    const speed = 0.35 * delta;

    if (moveLeft) this.x = Math.max(60, this.x - speed);
    if (moveRight) this.x = Math.min(world.width - this.width - 60, this.x + speed);

    if (this.isJumping) {
      this.vy += world.gravity;
      this.y += this.vy;

      if (this.y >= world.groundY - this.height) {
        this.y = world.groundY - this.height;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    if (this.isSweeping) {
      this.sweepTimer -= delta;
      if (this.sweepTimer <= 0) {
        this.isSweeping = false;
      }
    }
  }

  jump() {
    if (!this.isJumping) {
      this.vy = -20;
      this.isJumping = true;
    }
  }

  sweep() {
    if (state.sweepCooldown > 0) return;
    this.isSweeping = true;
    this.sweepTimer = 220;
    state.sweepCooldown = 320;
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);

    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.roundRect(0, 0, this.width, this.height, 20);
    ctx.fill();

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(this.width * 0.15, this.height * 0.15, this.width * 0.4, this.height * 0.25);

    ctx.fillStyle = '#fb7185';
    ctx.fillRect(this.width * 0.55, this.height * 0.6, this.width * 0.18, this.height * 0.35);

    // broom
    ctx.fillStyle = '#78350f';
    ctx.fillRect(this.width * 0.8, this.height * 0.2, 10, this.height * 0.75);
    ctx.fillStyle = '#fde68a';
    ctx.fillRect(this.width * 0.72, this.height * 0.78, 26, 18);

    if (this.isSweeping) {
      ctx.strokeStyle = 'rgba(255, 196, 0, 0.75)';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.arc(this.width + 20, this.height * 0.85, 28, 0.25 * Math.PI, 1.25 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Trash {
  constructor(type) {
    this.type = type;
    this.speed = world.speed + Math.random() * 2;

    if (type === 'small') {
      this.width = 40;
      this.height = 30;
      this.y = world.groundY - this.height + 4;
      this.color = '#9ca3af';
      this.points = 5;
    } else {
      this.width = 60 + Math.random() * 40;
      this.height = 50 + Math.random() * 20;
      this.y = world.groundY - this.height;
      this.color = '#d97706';
      this.points = 10;
    }

    this.x = world.width + Math.random() * 100;
  }

  update(delta) {
    this.x -= this.speed * (delta / 16.67);
  }

  draw(ctx) {
    ctx.fillStyle = this.color;
    ctx.beginPath();
    if (this.type === 'small') {
      ctx.ellipse(this.x + this.width / 2, this.y + this.height / 2, this.width / 2, this.height / 2, 0, 0, Math.PI * 2);
    } else {
      ctx.roundRect(this.x, this.y, this.width, this.height, 12);
    }
    ctx.fill();

    if (this.type === 'big') {
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(this.x + this.width * 0.2, this.y + 8, this.width * 0.6, 8);
    }
  }
}

const player = new Player();

function resetGame() {
  state.running = true;
  state.score = 0;
  state.smallTrash.length = 0;
  state.bigTrash.length = 0;
  state.spawnTimers.small = 0;
  state.spawnTimers.big = 800;
  state.sweepCooldown = 0;
  player.reset();
  scoreEl.textContent = '0';
}

function spawnTrash(delta) {
  state.spawnTimers.small -= delta;
  state.spawnTimers.big -= delta;

  if (state.spawnTimers.small <= 0) {
    state.smallTrash.push(new Trash('small'));
    state.spawnTimers.small = 700 + Math.random() * 900;
  }

  if (state.spawnTimers.big <= 0) {
    state.bigTrash.push(new Trash('big'));
    state.spawnTimers.big = 1500 + Math.random() * 2200;
  }
}

function updateScore(amount) {
  state.score += amount;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    localStorage.setItem('streetSweeperHighScore', state.highScore);
    highScoreEl.textContent = state.highScore;
  }
  scoreEl.textContent = state.score;
}

function checkCollisions() {
  // small trash: only collected while sweeping and nearby
  if (player.isSweeping) {
    const sweepZone = {
      x: player.x + player.width - 10,
      y: player.y + player.height * 0.6,
      width: 70,
      height: player.height * 0.4,
    };

    state.smallTrash = state.smallTrash.filter(trash => {
      if (rectIntersect(sweepZone, trash)) {
        updateScore(trash.points);
        return false;
      }
      return true;
    });
  }

  // big trash: must jump to collect; collision on ground ends game
  state.bigTrash = state.bigTrash.filter(trash => {
    const intersects = rectIntersect(player, trash);
    if (!intersects) return true;

    const playerFeet = player.y + player.height;
    if (playerFeet < trash.y + trash.height * 0.6) {
      updateScore(trash.points);
      return false;
    }

    gameOver();
    return false;
  });
}

function rectIntersect(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function update(delta) {
  if (!state.running) return;

  player.update(delta);
  spawnTrash(delta);

  state.smallTrash.forEach(t => t.update(delta));
  state.bigTrash.forEach(t => t.update(delta));

  state.smallTrash = state.smallTrash.filter(t => t.x + t.width > -40);
  state.bigTrash = state.bigTrash.filter(t => t.x + t.width > -60);

  if (state.sweepCooldown > 0) {
    state.sweepCooldown -= delta;
  }

  checkCollisions();
}

function drawBackground() {
  ctx.fillStyle = '#1f2937';
  ctx.fillRect(0, world.groundY, world.width, world.height - world.groundY);

  ctx.fillStyle = '#111827';
  ctx.fillRect(0, world.groundY + 32, world.width, world.height - world.groundY - 32);

  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  const laneY = world.groundY + 16;
  for (let x = 0; x < world.width; x += 60) {
    ctx.moveTo(x, laneY);
    ctx.lineTo(x + 30, laneY);
  }
  ctx.stroke();
}

function draw() {
  ctx.clearRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#60a5fa';
  ctx.fillRect(0, 0, world.width, world.groundY);

  ctx.fillStyle = '#facc15';
  ctx.fillRect(0, 0, world.width, 80);
  ctx.fillStyle = '#fde68a';
  ctx.fillRect(0, 80, world.width, 20);

  drawBackground();

  state.smallTrash.forEach(trash => trash.draw(ctx));
  state.bigTrash.forEach(trash => trash.draw(ctx));

  player.draw(ctx);

  if (!state.running) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(0, 0, world.width, world.height);
    ctx.fillStyle = '#f8fafc';
    ctx.textAlign = 'center';
    ctx.font = '48px "Segoe UI", sans-serif';
    ctx.fillText('Spiel pausiert', world.width / 2, world.height / 2 - 40);
    ctx.font = '24px "Segoe UI", sans-serif';
    ctx.fillText('Drücke Enter oder Leertaste, um zu starten.', world.width / 2, world.height / 2 + 10);

    if (state.score > 0) {
      ctx.fillText(`Punkte: ${state.score}`, world.width / 2, world.height / 2 + 60);
      ctx.fillText('Erneut versuchen mit R.', world.width / 2, world.height / 2 + 100);
    }
  }
}

function loop(timestamp) {
  const delta = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  update(delta);
  draw();

  requestAnimationFrame(loop);
}

function gameOver() {
  state.running = false;
}

function handleKeyDown(event) {
  const key = event.key.toLowerCase();

  if (key === 'w' || event.code === 'Space') {
    if (!state.running) {
      resetGame();
    }
    player.jump();
  }

  if (key === 's') {
    player.sweep();
  }

  if (key === 'r') {
    resetGame();
  }

  if (event.key === 'Enter' && !state.running) {
    resetGame();
  }

  keys.add(key);
}

function handleKeyUp(event) {
  keys.delete(event.key.toLowerCase());
}

window.addEventListener('keydown', handleKeyDown);
window.addEventListener('keyup', handleKeyUp);

resetGame();
requestAnimationFrame(loop);
