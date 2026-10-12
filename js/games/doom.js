// DOOM 3D / Cyber Raycaster FPS Engine for Arcadia
function gameDoom(canvas, W) {
  const H = Math.round(W * 0.72);
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');

  // Map 16x16
  const MAP_W = 16, MAP_H = 16;
  const MAP = [
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
    1,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1,
    1,0,2,2,0,0,1,0,3,3,3,0,0,4,0,1,
    1,0,2,0,0,0,0,0,3,0,3,0,0,4,0,1,
    1,0,0,0,0,0,1,0,0,0,3,0,0,0,0,1,
    1,1,1,0,1,1,1,0,3,3,3,0,4,4,0,1,
    1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,
    1,0,3,0,0,0,2,2,2,0,0,0,2,0,0,1,
    1,0,3,0,0,0,2,0,2,0,0,0,2,0,0,1,
    1,0,3,3,0,0,2,0,2,0,1,1,1,0,0,1,
    1,0,0,0,0,0,0,0,0,0,1,0,0,0,0,1,
    1,0,4,4,0,0,0,0,0,0,1,0,3,3,0,1,
    1,0,4,0,0,2,2,0,0,0,0,0,3,0,0,1,
    1,0,0,0,0,2,0,0,1,1,1,0,3,0,0,1,
    1,0,0,0,0,0,0,0,1,0,0,0,0,0,0,1,
    1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  ];

  let player = {
    x: 2.5, y: 2.5,
    dirX: 1, dirY: 0,
    planeX: 0, planeY: 0.66,
    hp: 100, maxHp: 100,
    ammo: 30, score: 0,
    weapon: 1, // 0: pistol, 1: shotgun
    shootCd: 0,
    muzzleFlash: 0
  };

  let enemies = [
    { x: 5.5, y: 3.5, hp: 40, maxHp: 40, alive: true, state: 'idle', cd: 0, type: 'imp' },
    { x: 12.5, y: 2.5, hp: 50, maxHp: 50, alive: true, state: 'idle', cd: 0, type: 'cyborg' },
    { x: 7.5, y: 7.5, hp: 40, maxHp: 40, alive: true, state: 'idle', cd: 0, type: 'imp' },
    { x: 13.5, y: 8.5, hp: 60, maxHp: 60, alive: true, state: 'idle', cd: 0, type: 'cyborg' },
    { x: 4.5, y: 11.5, hp: 40, maxHp: 40, alive: true, state: 'idle', cd: 0, type: 'imp' },
    { x: 12.5, y: 13.5, hp: 80, maxHp: 80, alive: true, state: 'idle', cd: 0, type: 'boss' },
  ];

  let items = [
    { x: 2.5, y: 8.5, type: 'hp', active: true },
    { x: 14.5, y: 3.5, type: 'ammo', active: true },
    { x: 8.5, y: 12.5, type: 'hp', active: true },
    { x: 13.5, y: 11.5, type: 'ammo', active: true },
  ];

  let keys = {};
  let running = true;
  let lastTime = performance.now();
  let zBuffer = new Array(W);

  function getMap(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return 1;
    return MAP[Math.floor(y) * MAP_W + Math.floor(x)];
  }

  function onKeyDown(e) {
    keys[e.code] = true;
    if (e.code === 'Digit1') player.weapon = 0;
    if (e.code === 'Digit2') player.weapon = 1;
    if (e.code === 'Space') shoot();
  }
  function onKeyUp(e) { keys[e.code] = false; }
  function onMouseDown(e) {
    if (e.button === 0) shoot();
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousedown', onMouseDown);

  function shoot() {
    if (!running || player.shootCd > 0 || player.hp <= 0) return;
    if (player.ammo <= 0) {
      if (window.ArcadiaAudio) window.ArcadiaAudio.playTone(200, 0.05, 'square', 0.1);
      return;
    }

    const isShotgun = player.weapon === 1;
    player.ammo -= isShotgun ? 2 : 1;
    player.shootCd = isShotgun ? 0.45 : 0.22;
    player.muzzleFlash = 0.1;

    if (window.ArcadiaAudio) {
      if (isShotgun) window.ArcadiaAudio.playExplosion();
      else window.ArcadiaAudio.playLaser();
    }

    // Hitscan ray from center of screen
    let hitEnemy = null;
    let closestDist = 999;

    enemies.forEach(en => {
      if (!en.alive) return;
      const dx = en.x - player.x;
      const dy = en.y - player.y;
      const dist = Math.hypot(dx, dy);
      
      // Calculate angle between player dir and enemy
      const angle = Math.atan2(dy, dx);
      const playerAngle = Math.atan2(player.dirY, player.dirX);
      let diff = angle - playerAngle;
      while (diff < -Math.PI) diff += Math.PI * 2;
      while (diff > Math.PI) diff -= Math.PI * 2;

      const tolerance = isShotgun ? 0.35 : 0.15;
      if (Math.abs(diff) < tolerance && dist < closestDist) {
        // Line of sight check
        let blocked = false;
        const steps = Math.floor(dist * 4);
        for (let i = 1; i < steps; i++) {
          const t = i / steps;
          const cx = player.x + dx * t;
          const cy = player.y + dy * t;
          if (getMap(cx, cy) > 0) { blocked = true; break; }
        }
        if (!blocked) {
          closestDist = dist;
          hitEnemy = en;
        }
      }
    });

    if (hitEnemy) {
      const dmg = isShotgun ? 45 : 22;
      hitEnemy.hp -= dmg;
      if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
      if (hitEnemy.hp <= 0) {
        hitEnemy.alive = false;
        player.score += hitEnemy.type === 'boss' ? 500 : 100;
        setScore(player.score);
        if (window.ArcadiaPassport) {
          window.ArcadiaPassport.unlock('doom_slayer');
        }
        if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
      }
    }
  }

  function update(dt) {
    if (player.hp <= 0) return;

    if (player.shootCd > 0) player.shootCd -= dt;
    if (player.muzzleFlash > 0) player.muzzleFlash -= dt;

    // Movement
    const moveSpeed = (keys['ShiftLeft'] ? 4.5 : 3.0) * dt;
    const rotSpeed = 2.4 * dt;

    if (keys['KeyA'] || keys['ArrowLeft']) {
      const oldDirX = player.dirX;
      player.dirX = player.dirX * Math.cos(-rotSpeed) - player.dirY * Math.sin(-rotSpeed);
      player.dirY = oldDirX * Math.sin(-rotSpeed) + player.dirY * Math.cos(-rotSpeed);
      const oldPlaneX = player.planeX;
      player.planeX = player.planeX * Math.cos(-rotSpeed) - player.planeY * Math.sin(-rotSpeed);
      player.planeY = oldPlaneX * Math.sin(-rotSpeed) + player.planeY * Math.cos(-rotSpeed);
    }
    if (keys['KeyD'] || keys['ArrowRight']) {
      const oldDirX = player.dirX;
      player.dirX = player.dirX * Math.cos(rotSpeed) - player.dirY * Math.sin(rotSpeed);
      player.dirY = oldDirX * Math.sin(rotSpeed) + player.dirY * Math.cos(rotSpeed);
      const oldPlaneX = player.planeX;
      player.planeX = player.planeX * Math.cos(rotSpeed) - player.planeY * Math.sin(rotSpeed);
      player.planeY = oldPlaneX * Math.sin(rotSpeed) + player.planeY * Math.cos(rotSpeed);
    }

    let dx = 0, dy = 0;
    if (keys['KeyW'] || keys['ArrowUp']) { dx += player.dirX * moveSpeed; dy += player.dirY * moveSpeed; }
    if (keys['KeyS'] || keys['ArrowDown']) { dx -= player.dirX * moveSpeed; dy -= player.dirY * moveSpeed; }
    if (keys['KeyQ']) { dx -= player.dirY * moveSpeed; dy += player.dirX * moveSpeed; }
    if (keys['KeyE']) { dx += player.dirY * moveSpeed; dy -= player.dirX * moveSpeed; }

    const margin = 0.25;
    if (getMap(player.x + dx + Math.sign(dx) * margin, player.y) === 0) player.x += dx;
    if (getMap(player.x, player.y + dy + Math.sign(dy) * margin) === 0) player.y += dy;

    // Pickups
    items.forEach(it => {
      if (!it.active) return;
      if (Math.hypot(it.x - player.x, it.y - player.y) < 0.6) {
        it.active = false;
        if (it.type === 'hp') {
          player.hp = Math.min(player.maxHp, player.hp + 35);
          if (window.ArcadiaAudio) window.ArcadiaAudio.playPowerup();
        } else if (it.type === 'ammo') {
          player.ammo += 20;
          if (window.ArcadiaAudio) window.ArcadiaAudio.playCoin();
        }
      }
    });

    // Enemy AI
    enemies.forEach(en => {
      if (!en.alive) return;
      const dist = Math.hypot(player.x - en.x, player.y - en.y);
      if (dist < 10) {
        // Move towards player if no wall
        const edx = (player.x - en.x) / dist;
        const edy = (player.y - en.y) / dist;
        if (dist > 1.2) {
          const spd = 1.2 * dt;
          if (getMap(en.x + edx * spd, en.y) === 0) en.x += edx * spd;
          if (getMap(en.x, en.y + edy * spd) === 0) en.y += edy * spd;
        }

        // Attack
        en.cd -= dt;
        if (en.cd <= 0 && dist < 4) {
          en.cd = en.type === 'boss' ? 1.0 : 1.6;
          player.hp = Math.max(0, player.hp - (en.type === 'boss' ? 25 : 12));
          if (window.ArcadiaAudio) window.ArcadiaAudio.playHit();
          if (player.hp <= 0) {
            if (window.ArcadiaAudio) window.ArcadiaAudio.playGameOver();
            showGover('DIED IN BATTLE', player.score);
          }
        }
      }
    });
  }

  function render() {
    // Ceiling & Floor
    const gradSky = ctx.createLinearGradient(0, 0, 0, H / 2);
    gradSky.addColorStop(0, '#0a0818');
    gradSky.addColorStop(1, '#20163a');
    ctx.fillStyle = gradSky;
    ctx.fillRect(0, 0, W, H / 2);

    const gradFloor = ctx.createLinearGradient(0, H / 2, 0, H);
    gradFloor.addColorStop(0, '#120d20');
    gradFloor.addColorStop(1, '#05030a');
    ctx.fillStyle = gradFloor;
    ctx.fillRect(0, H / 2, W, H / 2);

    // Wall Raycasting
    const numRays = Math.min(W, 320);
    const stripW = W / numRays;

    for (let x = 0; x < numRays; x++) {
      const cameraX = (2 * x) / numRays - 1;
      const rayDirX = player.dirX + player.planeX * cameraX;
      const rayDirY = player.dirY + player.planeY * cameraX;

      let mapX = Math.floor(player.x);
      let mapY = Math.floor(player.y);

      let sideDistX, sideDistY;
      const deltaDistX = Math.abs(1 / rayDirX);
      const deltaDistY = Math.abs(1 / rayDirY);
      let perpWallDist;

      let stepX, stepY;
      let hit = 0;
      let side = 0;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (player.x - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - player.x) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (player.y - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - player.y) * deltaDistY;
      }

      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (getMap(mapX, mapY) > 0) hit = getMap(mapX, mapY);
      }

      if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
      else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

      zBuffer[x] = perpWallDist;

      const lineHeight = Math.floor(H / Math.max(0.01, perpWallDist));
      const drawStart = Math.max(0, -lineHeight / 2 + H / 2);
      const drawEnd = Math.min(H - 1, lineHeight / 2 + H / 2);

      // Shading based on distance & wall color
      const wallColors = [
        ['#ff4f7b', '#b31e42'], // 1: Red Cyber
        ['#3df5c1', '#1a8264'], // 2: Cyan Neon
        ['#f0c040', '#8a6a12'], // 3: Gold Tech
        ['#7b5cff', '#3d259c'], // 4: Violet Core
      ];
      const wc = wallColors[(hit - 1) % wallColors.length] || ['#ff4f7b', '#b31e42'];
      const baseColor = side === 1 ? wc[1] : wc[0];

      ctx.fillStyle = baseColor;
      ctx.fillRect(x * stripW, drawStart, stripW + 0.5, drawEnd - drawStart);

      // Distance Fog overlay
      const fogAlpha = Math.min(0.85, perpWallDist / 12);
      if (fogAlpha > 0) {
        ctx.fillStyle = `rgba(6, 4, 14, ${fogAlpha})`;
        ctx.fillRect(x * stripW, drawStart, stripW + 0.5, drawEnd - drawStart);
      }
    }

    // Render Sprites (Enemies & Items)
    const sprites = [
      ...enemies.filter(e => e.alive).map(e => ({ x: e.x, y: e.y, kind: 'enemy', data: e })),
      ...items.filter(i => i.active).map(i => ({ x: i.x, y: i.y, kind: 'item', data: i }))
    ];

    sprites.sort((a, b) => {
      const distA = Math.hypot(player.x - a.x, player.y - a.y);
      const distB = Math.hypot(player.x - b.x, player.y - b.y);
      return distB - distA;
    });

    sprites.forEach(sp => {
      const spriteX = sp.x - player.x;
      const spriteY = sp.y - player.y;

      const invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
      const transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
      const transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

      if (transformY <= 0.1) return;

      const spriteScreenX = Math.floor((W / 2) * (1 + transformX / transformY));
      const spriteHeight = Math.abs(Math.floor(H / transformY));
      const drawStartY = Math.max(0, -spriteHeight / 2 + H / 2);
      const spriteWidth = Math.abs(Math.floor(H / transformY));
      const drawStartX = Math.max(0, -spriteWidth / 2 + spriteScreenX);

      const bufferIdx = Math.floor((spriteScreenX / W) * numRays);
      if (bufferIdx >= 0 && bufferIdx < numRays && transformY < zBuffer[bufferIdx]) {
        if (sp.kind === 'enemy') {
          // Draw Enemy Sprite
          const en = sp.data;
          ctx.fillStyle = en.type === 'boss' ? '#ff2255' : en.type === 'cyborg' ? '#3df5c1' : '#ff8c42';
          ctx.beginPath();
          ctx.arc(spriteScreenX, H / 2, spriteHeight * 0.28, 0, Math.PI * 2);
          ctx.fill();

          // Eyes
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(spriteScreenX - spriteWidth * 0.1, H / 2 - spriteHeight * 0.08, spriteWidth * 0.06, spriteHeight * 0.06);
          ctx.fillRect(spriteScreenX + spriteWidth * 0.04, H / 2 - spriteHeight * 0.08, spriteWidth * 0.06, spriteHeight * 0.06);

          // Health bar
          const barW = spriteWidth * 0.5;
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.fillRect(spriteScreenX - barW / 2, drawStartY - 10, barW, 6);
          ctx.fillStyle = '#ff4f7b';
          ctx.fillRect(spriteScreenX - barW / 2, drawStartY - 10, barW * (en.hp / en.maxHp), 6);
        } else {
          // Draw Item Sprite
          ctx.fillStyle = sp.data.type === 'hp' ? '#3df5c1' : '#f0c040';
          ctx.fillRect(spriteScreenX - spriteWidth * 0.15, H / 2 + spriteHeight * 0.1, spriteWidth * 0.3, spriteHeight * 0.3);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 12px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(sp.data.type === 'hp' ? '✚' : '⚡', spriteScreenX, H / 2 + spriteHeight * 0.28);
        }
      }
    });

    // Weapon & Muzzle Flash
    const gunX = W / 2;
    const gunY = H - 20;
    if (player.muzzleFlash > 0) {
      ctx.fillStyle = '#ffff66';
      ctx.beginPath();
      ctx.arc(gunX, gunY - 70, 40 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gun body
    ctx.fillStyle = '#333344';
    ctx.fillRect(gunX - 25, gunY - 80, 50, 80);
    ctx.fillStyle = '#222233';
    ctx.fillRect(gunX - 12, gunY - 110, 24, 40);
    ctx.fillStyle = '#555566';
    ctx.fillRect(gunX - 8, gunY - 110, 16, 20);

    // Crosshair
    ctx.strokeStyle = 'rgba(61, 245, 193, 0.7)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 8, H / 2); ctx.lineTo(W / 2 + 8, H / 2);
    ctx.moveTo(W / 2, H / 2 - 8); ctx.lineTo(W / 2, H / 2 + 8);
    ctx.stroke();

    // Minimap
    const mmSize = 70;
    const mmScale = mmSize / MAP_W;
    ctx.fillStyle = 'rgba(6, 4, 14, 0.75)';
    ctx.fillRect(W - mmSize - 12, 12, mmSize, mmSize);
    ctx.strokeStyle = 'rgba(240, 192, 64, 0.4)';
    ctx.strokeRect(W - mmSize - 12, 12, mmSize, mmSize);

    for (let my = 0; my < MAP_H; my++) {
      for (let mx = 0; mx < MAP_W; mx++) {
        if (getMap(mx, my) > 0) {
          ctx.fillStyle = '#ff4f7b';
          ctx.fillRect(W - mmSize - 12 + mx * mmScale, 12 + my * mmScale, mmScale, mmScale);
        }
      }
    }
    // Player on minimap
    ctx.fillStyle = '#3df5c1';
    ctx.fillRect(W - mmSize - 12 + player.x * mmScale - 1.5, 12 + player.y * mmScale - 1.5, 3, 3);

    // HUD Bar
    ctx.fillStyle = 'rgba(6, 4, 14, 0.85)';
    ctx.fillRect(0, H - 32, W, 32);
    ctx.fillStyle = '#3df5c1';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`HP: ${player.hp}%`, 14, H - 12);
    ctx.fillStyle = '#f0c040';
    ctx.fillText(`AMMO: ${player.ammo}`, 130, H - 12);
    ctx.fillStyle = '#ff4f7b';
    ctx.fillText(`SCORE: ${player.score}`, 260, H - 12);
  }

  function loop(now) {
    if (!running) return;
    const dt = Math.min(0.1, (now - lastTime) / 1000);
    lastTime = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  return {
    stop: () => {
      running = false;
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      canvas.removeEventListener('mousedown', onMouseDown);
    }
  };
}
