
var playerColors = window.playerColors = window.playerColors || {};
var activeGame = window.activeGame || null;
function gameSnakeLobby(canvas, W){
  // Show the lobby UI over the canvas area
  const area = document.getElementById('game-canvas-area');
  
  // Hide the canvas, show lobby div
  canvas.style.display = 'none';
  
  let lobbyEl = document.getElementById('snake-lobby');
  if(lobbyEl) lobbyEl.remove();
  
  const SKINS = [
    {name:'Aurora',   colors:['#a855f7','#3b82f6','#06b6d4'], desc:'// RAINBOW'},
    {name:'Venom',    colors:['#22c55e','#15803d','#052e16'], desc:'// JUNGLE'},
    {name:'Blaze',    colors:['#f97316','#ef4444','#fbbf24'], desc:'// FIRE'},
    {name:'Frost',    colors:['#67e8f9','#a5f3fc','#e0f2fe'], desc:'// ICE'},
    {name:'Neon',     colors:['#f0abfc','#e879f9','#a855f7'], desc:'// PLASMA'},
    {name:'Stealth',  colors:['#374151','#6b7280','#9ca3af'], desc:'// DARK'},
  ];
  let selSkin=0, selMode='classic', nickname='Player';
  
  function rgb(col){ return col; }
  
  function render(){
    const s = SKINS[selSkin];
    lobbyEl.innerHTML = `
      <div style="width:100%;max-width:440px;background:rgba(13,17,30,0.97);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:28px 28px 22px;box-sizing:border-box;font-family:'Rajdhani',sans-serif;">
        
        <!-- Title -->
        <div style="text-align:center;margin-bottom:24px;">
          <div style="font-family:'Press Start 2P',monospace;font-size:clamp(14px,3vw,22px);background:linear-gradient(90deg,#3df5c1,#7b5cff,#ff4f7b);-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:2px;">SLITHER.SNAKE</div>
          <div style="color:rgba(255,255,255,0.35);font-size:11px;letter-spacing:3px;margin-top:4px;">// CLASSIC MODE · BATTLE ARENA</div>
          <div style="display:flex;gap:24px;justify-content:center;margin-top:10px;">
            <span style="color:#3df5c1;font-size:13px;font-weight:700;">50+ <span style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:400;">SKINS</span></span>
            <span style="color:#7b5cff;font-size:13px;font-weight:700;">2 <span style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:400;">РЕЖИМИ</span></span>
            <span style="color:#ff4f7b;font-size:13px;font-weight:700;">14 <span style="color:rgba(255,255,255,0.4);font-size:10px;font-weight:400;">БОТИ</span></span>
          </div>
        </div>

        <!-- Nickname -->
        <div style="margin-bottom:16px;">
          <div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;margin-bottom:6px;">// НІКНЕЙМ</div>
          <input id="sn-nick" value="${nickname}" maxlength="16"
            style="width:100%;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.15);border-radius:8px;padding:10px 14px;color:#fff;font-size:15px;font-family:'Rajdhani',sans-serif;box-sizing:border-box;outline:none;"
            oninput="document.getElementById('snake-lobby')._nick=this.value"/>
        </div>

        <!-- Mode select -->
        <div style="margin-bottom:16px;">
          <div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;margin-bottom:8px;">// РЕЖИМ ГРИ</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
            ${['classic','arena'].map(m=>`
            <button onclick="document.getElementById('snake-lobby')._setMode('${m}')"
              style="background:${selMode===m?'rgba(61,245,193,0.12)':'rgba(255,255,255,0.04)'};border:1px solid ${selMode===m?'#3df5c1':'rgba(255,255,255,0.1)'};border-radius:10px;padding:14px 10px;cursor:pointer;transition:all .15s;color:#fff;text-align:center;">
              <div style="font-size:22px;margin-bottom:4px;">${m==='classic'?'🍎':'🌐'}</div>
              <div style="font-family:'Press Start 2P',monospace;font-size:8px;letter-spacing:1px;">${m==='classic'?'КЛАСИКА':'АРЕНА'}</div>
              <div style="color:rgba(255,255,255,0.4);font-size:10px;margin-top:3px;">${m==='classic'?'Google Snake':'Slither.io style'}</div>
            </button>`).join('')}
          </div>
        </div>

        <!-- Skin select -->
        <div style="margin-bottom:20px;">
          <div style="color:rgba(255,255,255,0.4);font-size:10px;letter-spacing:3px;margin-bottom:8px;">// ЗМІЙКА</div>
          <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between;">
            <div style="display:flex;align-items:center;gap:12px;">
              <!-- skin preview -->
              <div style="position:relative;width:52px;height:32px;">
                ${s.colors.map((col,i)=>`<div style="position:absolute;left:${i*14}px;top:50%;transform:translateY(-50%);width:24px;height:24px;border-radius:50%;background:${col};box-shadow:0 0 8px ${col};${i===0?'z-index:3;width:28px;height:28px;top:50%;':'z-index:'+(3-i)+';'}"></div>`).join('')}
              </div>
              <div>
                <div style="color:#fff;font-weight:700;font-size:15px;">${s.name}</div>
                <div style="color:rgba(255,255,255,0.4);font-size:11px;">${s.desc}</div>
              </div>
            </div>
            <button onclick="document.getElementById('snake-lobby')._nextSkin()"
              style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.2);border-radius:8px;padding:8px 14px;color:#fff;cursor:pointer;font-family:'Rajdhani',sans-serif;font-size:12px;letter-spacing:1px;">🎨 ЗМІНИТИ</button>
          </div>
        </div>

        <!-- Play button -->
        <button onclick="document.getElementById('snake-lobby')._play()"
          style="width:100%;background:linear-gradient(90deg,#3df5c1,#06b6d4);border:none;border-radius:10px;padding:16px;font-family:'Press Start 2P',monospace;font-size:13px;color:#000;cursor:pointer;letter-spacing:2px;transition:opacity .15s;">
          ▶ ГРАТИ
        </button>
      </div>
    `;
    // re-bind nick input
    const ni = lobbyEl.querySelector('#sn-nick');
    if(ni){ ni.value = nickname; ni.oninput = e=>{ nickname=e.target.value; }; }
  }
  
  lobbyEl = document.createElement('div');
  lobbyEl.id = 'snake-lobby';
  lobbyEl.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;z-index:10;overflow-y:auto;';
  
  lobbyEl._setMode = (m) => { selMode=m; render(); };
  lobbyEl._nextSkin = () => { selSkin=(selSkin+1)%SKINS.length; render(); };
  lobbyEl._play = () => {
    const nick = nickname || 'Player';
    lobbyEl.remove();
    canvas.style.display='block';
    if(selMode==='classic'){
      activeGame = gameSnake(canvas, W);
      if(activeGame.setColor) activeGame.setColor(SKINS[selSkin].colors[0]);
    } else {
      activeGame = gameSnakeIO(canvas, W);
      if(activeGame.setColor) activeGame.setColor(SKINS[selSkin].colors[0]);
      if(activeGame.setNick)  activeGame.setNick(nick);
    }
  };
  
  area.style.position='relative';
  area.appendChild(lobbyEl);
  render();
  
  return {
    stop(){
      canvas.style.display='block';
      const l=document.getElementById('snake-lobby');
      if(l)l.remove();
      if(activeGame&&activeGame!==_lobbyStub&&activeGame.stop) activeGame.stop();
    },
    setColor(){}
  };
}
const _lobbyStub={};


function gameSnake(canvas,W){
  const H=W; canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const GR=20,COLS=Math.floor(W/GR),ROWS=Math.floor(H/GR);
  let snake,dir,ndir,food,score,raf,running,paused,color,speedLevel=1;
  const SPEEDS=[180,130,90,55];

  function rndFood(){let f;do{f={x:~~(Math.random()*COLS),y:~~(Math.random()*ROWS)};}while(snake.some(s=>s.x===f.x&&s.y===f.y));return f;}
  function init(){snake=[{x:~~(COLS/2),y:~~(ROWS/2)}];dir={x:1,y:0};ndir={x:1,y:0};food=rndFood();score=0;running=true;paused=false;setScore(0);hideGover();}

  function draw(){
    ctx.fillStyle='#06040e';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(61,245,193,.05)';ctx.lineWidth=.5;
    for(let x=0;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*GR,0);ctx.lineTo(x*GR,H);ctx.stroke();}
    for(let y=0;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*GR);ctx.lineTo(W,y*GR);ctx.stroke();}
    // food
    ctx.save();ctx.shadowBlur=16;ctx.shadowColor=color||'#f0c040';
    ctx.fillStyle=color||'#f0c040';ctx.fillRect(food.x*GR+3,food.y*GR+3,GR-6,GR-6);ctx.restore();
    // snake
    snake.forEach((s,i)=>{
      const t=1-i/snake.length;
      ctx.save();ctx.shadowBlur=i===0?20:4;ctx.shadowColor=color||'#3df5c1';
      ctx.fillStyle=i===0?(color||'#3df5c1'):`rgba(${hexRgb(color||'#3df5c1')},${.2+t*.7})`;
      ctx.fillRect(s.x*GR+1,s.y*GR+1,GR-2,GR-2);
      if(i===0){ctx.fillStyle='#000';const ex=dir.x===1?10:dir.x===-1?4:7,ey=dir.y===1?10:dir.y===-1?4:7;ctx.fillRect(s.x*GR+ex-1,s.y*GR+ey-1,3,3);ctx.fillRect(s.x*GR+ex+4,s.y*GR+ey-1,3,3);}
      ctx.restore();
    });
    if(paused){ctx.fillStyle='rgba(6,4,14,.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#f0c040';ctx.font='bold 14px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('PAUSED',W/2,H/2);ctx.textAlign='left';}
  }

  let last=0;
  function loop(ts){
    if(!running)return;
    raf=requestAnimationFrame(loop);
    if(paused){draw();return;}
    if(ts-last<SPEEDS[speedLevel])return;
    last=ts;
    dir=ndir;
    const h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
    if(h.x<0||h.x>=COLS||h.y<0||h.y>=ROWS||snake.some(s=>s.x===h.x&&s.y===h.y)){
      running=false;showGover('GAME OVER','Score: '+score,()=>{init();raf=requestAnimationFrame(loop);});return;
    }
    snake.unshift(h);
    if(h.x===food.x&&h.y===food.y){score++;setScore(score);food=rndFood();}else snake.pop();
    draw();
  }

  const onKey=e=>{
    if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d',' ','p'].includes(e.key))e.preventDefault();
    if(e.key==='p'||e.key==='P'){paused=!paused;return;}
    if((e.key==='ArrowUp'||e.key==='w')&&dir.y!==1)ndir={x:0,y:-1};
    if((e.key==='ArrowDown'||e.key==='s')&&dir.y!==-1)ndir={x:0,y:1};
    if((e.key==='ArrowLeft'||e.key==='a')&&dir.x!==1)ndir={x:-1,y:0};
    if((e.key==='ArrowRight'||e.key==='d')&&dir.x!==-1)ndir={x:1,y:0};
  };
  document.addEventListener('keydown',onKey);
  color=playerColors['snake'];
  init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);},setColor(c){color=c;},setSpeed(s){speedLevel=s;}};
}

/* ══════════════════════════════════════════
   GAME: FLAPPY BIRD
══════════════════════════════════════════ */
function gameFlappy(canvas,W){
  const H=~~(W*1.1);canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const GAP=130,PW=52,SPD=2.8,GR=.38,JMP=-7.4;
  let bird,pipes,score,raf,state,frame,color;

  function init(){bird={x:W*.22,y:H/2,vy:0,r:14};pipes=[];score=0;frame=0;state='wait';setScore(0);hideGover();color=playerColors['flappy'];}

  function addPipe(){const topH=60+Math.random()*(H-GAP-100);pipes.push({x:W,topH,scored:false});}

  function loop(){
    raf=requestAnimationFrame(loop);frame++;
    // bg sky
    const g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#0d1b3e');g.addColorStop(1,'#1a3a6e');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    // clouds
    ctx.fillStyle='rgba(255,255,255,.1)';
    [[W*.15,H*.15,40,18],[W*.6,H*.1,55,20],[W*.85,H*.2,35,15]].forEach(([cx,cy,rw,rh])=>{ctx.beginPath();ctx.ellipse(cx,cy,rw,rh,0,0,Math.PI*2);ctx.fill();});
    // ground
    ctx.fillStyle='#3a7a3a';ctx.fillRect(0,H-30,W,30);ctx.fillStyle='#5aaa5a';ctx.fillRect(0,H-30,W,6);

    if(state==='play'){
      bird.vy+=GR;bird.y+=bird.vy;
      if(frame%88===0)addPipe();
      pipes.forEach(p=>p.x-=SPD);pipes=pipes.filter(p=>p.x>-PW-10);
      pipes.forEach(p=>{if(!p.scored&&p.x+PW<bird.x){p.scored=true;score++;setScore(score);}});
      const hit=pipes.some(p=>{const ix=bird.x+bird.r>p.x&&bird.x-bird.r<p.x+PW;return ix&&(bird.y-bird.r<p.topH||bird.y+bird.r>p.topH+GAP);});
      if(hit||bird.y+bird.r>=H-30){state='dead';showGover('GAME OVER','Score: '+score,()=>init());}
    }
    if(state==='wait')bird.y=H/2+Math.sin(frame*.06)*10;

    // pipes
    pipes.forEach(p=>{
      const pg=ctx.createLinearGradient(p.x,0,p.x+PW,0);pg.addColorStop(0,'#3a7a3a');pg.addColorStop(.5,'#5aaa5a');pg.addColorStop(1,'#2a5a2a');
      ctx.fillStyle=pg;ctx.fillRect(p.x,0,PW,p.topH);ctx.fillRect(p.x-5,p.topH-16,PW+10,18);
      ctx.fillRect(p.x,p.topH+GAP,PW,H);ctx.fillRect(p.x-5,p.topH+GAP,PW+10,18);
      ctx.fillStyle='rgba(255,255,255,.1)';ctx.fillRect(p.x+6,0,5,p.topH);ctx.fillRect(p.x+6,p.topH+GAP+18,5,H);
    });

    // bird
    ctx.save();ctx.translate(bird.x,bird.y);ctx.rotate(Math.max(-.5,Math.min(1.2,bird.vy*.08)));
    ctx.shadowBlur=12;ctx.shadowColor=color||'#f0c040';
    ctx.fillStyle=color||'#f0c040';ctx.beginPath();ctx.ellipse(0,0,bird.r,bird.r*.85,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='rgba(0,0,0,.25)';ctx.beginPath();ctx.ellipse(-3,Math.sin(frame*.25)*5,8,5,.3,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(6,-3,4,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#333';ctx.beginPath();ctx.arc(7,-3,2.5,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#d04010';ctx.beginPath();ctx.moveTo(10,-2);ctx.lineTo(17,0);ctx.lineTo(10,3);ctx.closePath();ctx.fill();
    ctx.restore();

    if(state==='wait'){ctx.fillStyle='rgba(255,255,255,.85)';ctx.font='bold 12px "Press Start 2P"';ctx.textAlign='center';ctx.fillText('PRESS SPACE / CLICK',W/2,H*.17);ctx.textAlign='left';}
    if(state==='play'){ctx.fillStyle='#fff';ctx.font='bold 24px "Press Start 2P"';ctx.textAlign='center';ctx.shadowBlur=8;ctx.shadowColor='rgba(0,0,0,.8)';ctx.fillText(score,W/2,46);ctx.shadowBlur=0;ctx.textAlign='left';}
  }

  const onKey=e=>{if(e.code==='Space'){e.preventDefault();if(state==='wait')state='play';bird.vy=JMP;}};
  const onClick=()=>{if(state==='wait')state='play';bird.vy=JMP;};
  document.addEventListener('keydown',onKey);canvas.addEventListener('click',onClick);
  init();raf=requestAnimationFrame(loop);
  return{stop(){cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);canvas.removeEventListener('click',onClick);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: BREAKOUT
══════════════════════════════════════════ */
function gameBreakout(canvas,W){
  const H=~~(W*1.1);canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  const COLS=8,ROWS=5,PW=90,PH=12,BR=9;
  const BH=20,BW=~~(W/COLS);
  const RCOLS=['#ff4f7b','#ff8c42','#f0c040','#3df5c1','#7b5cff'];
  let paddle,ball,bricks,score,lives,raf,state,mouseX,color;

  function init(){
    paddle={x:W/2-PW/2,y:H-42,w:PW};ball={x:W/2,y:H-72,vx:3.8,vy:-5};
    score=0;lives=3;state='play';setScore(0);hideGover();color=playerColors['breakout'];
    bricks=[];
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)
      bricks.push({x:c*BW+3,y:52+r*(BH+5),w:BW-6,h:BH,alive:true,color:RCOLS[r%RCOLS.length]});
  }

  function loop(){
    raf=requestAnimationFrame(loop);if(state!=='play')return;
    ctx.fillStyle='#06040e';ctx.fillRect(0,0,W,H);
    ctx.strokeStyle='rgba(123,92,255,.07)';ctx.lineWidth=1;
    for(let x=0;x<W;x+=34){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=34){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    if(mouseX!==undefined)paddle.x=Math.max(0,Math.min(W-PW,mouseX-PW/2));
    ball.x+=ball.vx;ball.y+=ball.vy;
    if(ball.x-BR<0){ball.x=BR;ball.vx*=-1;}
    if(ball.x+BR>W){ball.x=W-BR;ball.vx*=-1;}
    if(ball.y-BR<0){ball.y=BR;ball.vy*=-1;}
    if(ball.y+BR>H){lives--;if(!lives){state='over';showGover('GAME OVER','Score: '+score,()=>init());return;}ball.x=W/2;ball.y=H-72;ball.vx=3.8*(Math.random()<.5?1:-1);ball.vy=-5;}
    if(ball.y+BR>=paddle.y&&ball.y-BR<paddle.y+PH&&ball.x>paddle.x&&ball.x<paddle.x+PW&&ball.vy>0){ball.vy*=-1;ball.vx=((ball.x-(paddle.x+PW/2))/(PW/2))*5.5;ball.y=paddle.y-BR;}
    bricks.forEach(b=>{if(!b.alive)return;if(ball.x>b.x&&ball.x<b.x+b.w&&ball.y+BR>b.y&&ball.y-BR<b.y+b.h){b.alive=false;score+=10;setScore(score);ball.vy*=-1;}});
    if(bricks.every(b=>!b.alive)){state='win';showGover('YOU WIN! 🎉','Score: '+score,()=>init());return;}

    bricks.forEach(b=>{if(!b.alive)return;ctx.save();ctx.shadowBlur=10;ctx.shadowColor=b.color;ctx.fillStyle=b.color;ctx.fillRect(b.x,b.y,b.w,b.h);ctx.fillStyle='rgba(255,255,255,.15)';ctx.fillRect(b.x,b.y,b.w,4);ctx.restore();});

    // paddle
    ctx.save();ctx.shadowBlur=18;ctx.shadowColor=color||'#7b5cff';
    const pg=ctx.createLinearGradient(paddle.x,0,paddle.x+PW,0);
    const c2=color||'#7b5cff';pg.addColorStop(0,c2+'88');pg.addColorStop(.5,c2);pg.addColorStop(1,c2+'88');
    ctx.fillStyle=pg;ctx.beginPath();ctx.roundRect(paddle.x,paddle.y,PW,PH,5);ctx.fill();ctx.restore();

    // ball
    ctx.save();ctx.shadowBlur=20;ctx.shadowColor='#fff';
    const bg2=ctx.createRadialGradient(ball.x-3,ball.y-3,1,ball.x,ball.y,BR);bg2.addColorStop(0,'#fff');bg2.addColorStop(1,'#bbb');
    ctx.fillStyle=bg2;ctx.beginPath();ctx.arc(ball.x,ball.y,BR,0,Math.PI*2);ctx.fill();ctx.restore();

    for(let i=0;i<lives;i++){ctx.fillStyle=color||'#ff4f7b';ctx.font='13px "Press Start 2P"';ctx.fillText('♥',10+i*22,H-10);}
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='12px "Press Start 2P"';ctx.textAlign='right';ctx.fillText(score,W-10,H-10);ctx.textAlign='left';
  }

  const onKey=e=>{if(e.key==='ArrowLeft'||e.key==='a')paddle.x=Math.max(0,paddle.x-22);if(e.key==='ArrowRight'||e.key==='d')paddle.x=Math.min(W-PW,paddle.x+22);};
  const onMove=e=>{const r=canvas.getBoundingClientRect();mouseX=e.clientX-r.left;};
  document.addEventListener('keydown',onKey);canvas.addEventListener('mousemove',onMove);
  init();raf=requestAnimationFrame(loop);
  return{stop(){cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);canvas.removeEventListener('mousemove',onMove);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: ASTEROIDS (with upgrade system)
══════════════════════════════════════════ */
function gameAsteroids(canvas,W){
  const H=W;canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let ship,bullets,asteroids,particles,score,lives,raf,running,keys,inv,invT,color;
  let upgrades={bulletSpeed:1,bulletCount:1,shipSize:1,shield:false,rapidFire:false};
  let upgradeAvail=false,nextUpgrade=1000,upgradeOpen=false;

  const UPLIST=[
    {id:'bulletSpeed',icon:'⚡',name:'HYPER SHOTS',desc:'Bullets travel 50% faster',cost:1000},
    {id:'bulletCount',icon:'💥',name:'SPREAD SHOT',desc:'Fire 3 bullets at once',cost:1000},
    {id:'shipSize',icon:'🚀',name:'TITAN HULL',desc:'Bigger ship, wider hit',cost:1000},
    {id:'shield',icon:'🛡️',name:'ENERGY SHIELD',desc:'Absorb one fatal hit',cost:1000},
    {id:'rapidFire',icon:'🔥',name:'RAPID FIRE',desc:'2x fire rate',cost:1000},
  ];

  function rndAst(big=true){
    const r=big?55+Math.random()*20:18+Math.random()*14;
    let x,y;if(Math.random()<.5){x=Math.random()<.5?-r:W+r;y=Math.random()*H;}else{y=Math.random()<.5?-r:H+r;x=Math.random()*W;}
    const a=Math.random()*Math.PI*2,spd=.9+Math.random()*1.3+(big?0:.7);
    return{x,y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,r,rot:0,rv:(Math.random()-.5)*.04,pts:genPts(r),big};
  }
  function genPts(r){const n=7+~~(Math.random()*4);return Array.from({length:n},(_,i)=>{const a=(i/n)*Math.PI*2;const d=r*(.7+Math.random()*.5);return{x:Math.cos(a)*d,y:Math.sin(a)*d};});}
  function wrap(o){if(o.x<-80)o.x+=W+160;if(o.x>W+80)o.x-=W+160;if(o.y<-80)o.y+=H+160;if(o.y>H+160)o.y-=H+160;}
  function spawnParts(x,y,col,n=12){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:col});}}

  function init(){
    ship={x:W/2,y:H/2,vx:0,vy:0,angle:-Math.PI/2};
    bullets=[];asteroids=Array.from({length:4},()=>rndAst(true));
    particles=[];score=0;lives=3;running=true;inv=true;invT=120;
    upgradeAvail=false;upgradeOpen=false;
    upgrades={bulletSpeed:1,bulletCount:1,shipSize:1,shield:false,rapidFire:false};
    nextUpgrade=1000;setScore(0);hideGover();
    document.getElementById('upgrade-ind').style.display='none';
    document.getElementById('upgrade-modal').classList.remove('show');
    color=playerColors['asteroids'];
  }

  function showUpgradeMenu(){
    upgradeOpen=true;
    const avail=UPLIST.filter(u=>{
      if(u.id==='shield'&&upgrades.shield)return false;
      if(u.id==='rapidFire'&&upgrades.rapidFire)return false;
      if(u.id==='bulletCount'&&upgrades.bulletCount>=3)return false;
      if(u.id==='bulletSpeed'&&upgrades.bulletSpeed>=3)return false;
      if(u.id==='shipSize'&&upgrades.shipSize>=2)return false;
      return true;
    });
    document.getElementById('up-points-left').textContent=`You have ${score} points — pick an upgrade:`;
    const cont=document.getElementById('up-cards-container');
    cont.innerHTML='';
    avail.slice(0,4).forEach(u=>{
      const c=document.createElement('div');c.className='up-card';
      c.innerHTML=`<span class="up-card-icon">${u.icon}</span><div class="up-card-name">${u.name}</div><div class="up-card-desc">${u.desc}</div><div class="up-card-cost">FREE UPGRADE</div>`;
      c.onclick=()=>{
        if(u.id==='bulletSpeed')upgrades.bulletSpeed=Math.min(3,upgrades.bulletSpeed+1);
        if(u.id==='bulletCount')upgrades.bulletCount=Math.min(3,upgrades.bulletCount+1);
        if(u.id==='shipSize')upgrades.shipSize=Math.min(2,upgrades.shipSize+1);
        if(u.id==='shield')upgrades.shield=true;
        if(u.id==='rapidFire')upgrades.rapidFire=true;
        nextUpgrade+=1000;upgradeAvail=false;upgradeOpen=false;
        document.getElementById('upgrade-modal').classList.remove('show');
        document.getElementById('upgrade-ind').style.display='none';
      };
      cont.appendChild(c);
    });
    if(!avail.length){cont.innerHTML='<div style="color:var(--dim);font-family:VT323,monospace;font-size:20px;padding:20px">All upgrades maxed!</div>';}
    document.getElementById('upgrade-modal').classList.add('show');
  }

  // 🐛 CLASSIC BUG RESTORED: hold SPACE = endless bullet stream every frame
  function shoot(){
    const bspd=8+upgrades.bulletSpeed*2;
    const spread=upgrades.bulletCount>1?[-0.15,0,0.15].slice(0,upgrades.bulletCount):[0];
    spread.forEach(da=>{
      const a=ship.angle+da;
      bullets.push({x:ship.x+Math.cos(a)*22,y:ship.y+Math.sin(a)*22,vx:Math.cos(a)*bspd+ship.vx,vy:Math.sin(a)*bspd+ship.vy,life:50});
    });
  }

  function loop(ts){
    raf=requestAnimationFrame(loop);
    if(!running||upgradeOpen)return;
    if(keys['a']||keys['ArrowLeft'])ship.angle-=.055;
    if(keys['d']||keys['ArrowRight'])ship.angle+=.055;
    ship.thrusting=keys['w']||keys['ArrowUp'];
    if(ship.thrusting){ship.vx+=Math.cos(ship.angle)*.22;ship.vy+=Math.sin(ship.angle)*.22;}
    ship.vx*=.97;ship.vy*=.97;ship.x+=ship.vx;ship.y+=ship.vy;wrap(ship);
    if(inv){invT--;if(!invT)inv=false;}
    if(keys[' '])shoot();

    bullets.forEach(b=>{b.x+=b.vx;b.y+=b.vy;b.life--;wrap(b);});
    bullets=bullets.filter(b=>b.life>0);
    asteroids.forEach(a=>{a.x+=a.vx;a.y+=a.vy;a.rot+=a.rv;wrap(a);});
    particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.life-=.035;p.vx*=.96;p.vy*=.96;});
    particles=particles.filter(p=>p.life>0);

    // bullet vs asteroid
    for(let i=bullets.length-1;i>=0;i--){
      for(let j=asteroids.length-1;j>=0;j--){
        if(Math.hypot(bullets[i].x-asteroids[j].x,bullets[i].y-asteroids[j].y)<asteroids[j].r){
          bullets[i].life=0;
          const a=asteroids[j];spawnParts(a.x,a.y,color||'#7b5cff');
          const pts=a.big?10:20;score+=pts;setScore(score);
          if(score>=nextUpgrade&&!upgradeAvail){upgradeAvail=true;document.getElementById('upgrade-ind').style.display='';}
          if(a.big){for(let k=0;k<2;k++){const na=rndAst(false);na.x=a.x;na.y=a.y;asteroids.push(na);}}
          asteroids.splice(j,1);break;
        }
      }
    }
    if(!asteroids.length)asteroids=Array.from({length:4+~~(score/400)},()=>rndAst(true));

    if(!inv){
      for(const a of asteroids){
        const sz=(upgrades.shipSize>1?18:12);
        if(Math.hypot(ship.x-a.x,ship.y-a.y)<a.r+sz){
          if(upgrades.shield){upgrades.shield=false;inv=true;invT=90;spawnParts(ship.x,ship.y,'#44aaff',20);}
          else{lives--;spawnParts(ship.x,ship.y,color||'#ff4f7b',20);if(!lives){running=false;showGover('GAME OVER','Score: '+score,()=>init());return;}ship.x=W/2;ship.y=H/2;ship.vx=0;ship.vy=0;inv=true;invT=130;}
          break;
        }
      }
    }

    // DRAW
    ctx.fillStyle='#06040e';ctx.fillRect(0,0,W,H);
    // stars static
    for(let i=0;i<80;i++){ctx.fillStyle=`rgba(255,255,255,${.2+.4*((i*73)%100/100)})`;ctx.fillRect((i*137)%W,(i*97)%H,1+(i%2),1+(i%2));}

    asteroids.forEach(a=>{
      ctx.save();ctx.translate(a.x,a.y);ctx.rotate(a.rot);
      ctx.shadowBlur=8;ctx.shadowColor='#7b5cff';ctx.strokeStyle='#9a7cff';ctx.lineWidth=2;ctx.fillStyle='rgba(123,92,255,.15)';
      ctx.beginPath();a.pts.forEach((p,i)=>i===0?ctx.moveTo(p.x,p.y):ctx.lineTo(p.x,p.y));ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
    });
    bullets.forEach(b=>{ctx.save();ctx.shadowBlur=14;ctx.shadowColor=color||'#f0c040';ctx.fillStyle=color||'#f0c040';ctx.beginPath();ctx.arc(b.x,b.y,3.5,0,Math.PI*2);ctx.fill();ctx.restore();});
    particles.forEach(p=>{ctx.save();ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,3*p.life,0,Math.PI*2);ctx.fill();ctx.restore();});

    // shield bubble
    if(upgrades.shield){ctx.save();ctx.globalAlpha=.25+Math.sin(Date.now()*.005)*.1;ctx.strokeStyle='#44aaff';ctx.shadowBlur=20;ctx.shadowColor='#44aaff';ctx.lineWidth=2;ctx.beginPath();ctx.arc(ship.x,ship.y,26,0,Math.PI*2);ctx.stroke();ctx.restore();}

    if(!inv||~~(invT/8)%2===0){
      const sc=upgrades.shipSize>1?1.4:1;
      ctx.save();ctx.translate(ship.x,ship.y);ctx.rotate(ship.angle);ctx.scale(sc,sc);
      ctx.shadowBlur=18;ctx.shadowColor=color||'#3df5c1';ctx.strokeStyle=color||'#3df5c1';ctx.lineWidth=2;ctx.fillStyle=(color||'#3df5c1')+'22';
      ctx.beginPath();ctx.moveTo(18,0);ctx.lineTo(-12,10);ctx.lineTo(-7,0);ctx.lineTo(-12,-10);ctx.closePath();ctx.fill();ctx.stroke();
      if(ship.thrusting){ctx.fillStyle='#f0c040';ctx.shadowColor='#f0c040';ctx.beginPath();ctx.moveTo(-7,0);ctx.lineTo(-16,5*(.8+Math.random()*.4));ctx.lineTo(-16,-5*(.8+Math.random()*.4));ctx.closePath();ctx.fill();}
      ctx.restore();
    }
    for(let i=0;i<lives;i++){ctx.fillStyle=color||'#3df5c1';ctx.font='12px "Press Start 2P"';ctx.fillText('△',10+i*26,H-10);}
    if(upgrades.shield){ctx.fillStyle='#44aaff';ctx.font='12px "Press Start 2P"';ctx.fillText('🛡',lives*26+14,H-10);}
    ctx.fillStyle='rgba(255,255,255,.5)';ctx.font='12px "Press Start 2P"';ctx.textAlign='right';ctx.fillText(score,W-10,H-10);ctx.textAlign='left';
    ctx.fillStyle='rgba(123,92,255,.7)';ctx.font='9px "Press Start 2P"';ctx.textAlign='right';ctx.fillText('NEXT UP: '+nextUpgrade,W-10,H-26);ctx.textAlign='left';
  }

  keys={};
  const kd=e=>{keys[e.key]=true;if(e.code==='Space'){e.preventDefault();}if(e.key==='u'&&upgradeAvail&&!upgradeOpen)showUpgradeMenu();};
  const ku=e=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  document.getElementById('upgrade-ind').addEventListener('click',()=>{if(upgradeAvail&&!upgradeOpen)showUpgradeMenu();});
  init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: SNAKE.IO  — slither.io style
   Continuous smooth movement, mouse steering,
   large scrolling world, round snake segments,
   glowing orbs, minimap, smart AI bots
══════════════════════════════════════════ */

function gameSnakeIO(canvas,W){
  const H=W; canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');

  /* ── World & constants ── */
  const WW=2400, WH=2400;           // world size
  const BASE_SPEED=2.2, BOOST_MULT=1.9;
  const SEG_DIST=8;                  // distance between segments
  const FOOD_COUNT=320;
  const BOT_COUNT=14;
  const BOTNAMES=['APEX','VOID','NEON','ZARA','KORE','FLUX','NOVA','SYNC','VEX','RUNE','BYTE','GRID','DUSK','ECHO'];
  const BOTCOLS=['#ff4f7b','#7b5cff','#ff8c42','#44aaff','#f0c040','#ff44cc','#44ff88','#ff6644','#aa44ff','#44ffcc','#ffaa00','#ff2266','#00eeff','#ff9900'];

  let snakes, food, raf, running, score, playerColor, boosting=false;
  let mouseAngle=0, camX=0, camY=0;
  let deathOrbs=[];  // orbs dropped on death
  let frame=0;

  /* ── Snake factory ── */
  function mkSnake(isPlayer, idx){
    const margin=200;
    const sx = margin+Math.random()*(WW-margin*2);
    const sy = margin+Math.random()*(WH-margin*2);
    const col = isPlayer ? (playerColors['snakeio']||'#3df5c1') : BOTCOLS[idx%BOTCOLS.length];
    const startLen = isPlayer ? 20 : 16+~~(Math.random()*20);
    const angle = Math.random()*Math.PI*2;
    const segs=[];
    for(let i=0;i<startLen;i++) segs.push({x:sx-Math.cos(angle)*i*SEG_DIST, y:sy-Math.sin(angle)*i*SEG_DIST});
    return{
      segs, angle, targetAngle:angle,
      color:col, darkColor:darken(col,.45),
      name: isPlayer?'YOU':BOTNAMES[idx%BOTNAMES.length],
      isPlayer, alive:true, score:0,
      speed: BASE_SPEED, boosting:false,
      r: isPlayer?9:7+Math.random()*4,     // head radius
      // AI state
      aiTimer:0, aiTarget:null, aiMode:'food',
      killTimer:0
    };
  }

  /* ── Food ── */
  function mkFood(n=FOOD_COUNT){
    return Array.from({length:n},()=>({
      x:50+Math.random()*(WW-100), y:50+Math.random()*(WH-100),
      color:BOTCOLS[~~(Math.random()*BOTCOLS.length)],
      r:4+Math.random()*4, pulse:Math.random()*Math.PI*2
    }));
  }

  /* ── Colour helpers ── */
  function darken(hex,amt){
    let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    r=~~(r*amt);g=~~(g*amt);b=~~(b*amt);
    return '#'+[r,g,b].map(v=>v.toString(16).padStart(2,'0')).join('');
  }
  function hexA(hex,a){
    const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
    return `rgba(${r},${g},${b},${a})`;
  }

  /* ══ SMART BOT AI ══
     Modes: food-seek | flee | encircle | ambush
     Uses angular steering (like real slither.io bots)
  */
  function botAI(s, dt){
    s.aiTimer -= dt;
    if(s.aiTimer > 0) return;
    s.aiTimer = 80 + Math.random()*120;

    const hx=s.segs[0].x, hy=s.segs[0].y;
    const myLen=s.segs.length;

    // 1. Scan for threats (bigger snakes heads within danger radius)
    let threat=null, threatD=Infinity;
    snakes.forEach(o=>{
      if(o===s||!o.alive)return;
      const d=dist2(hx,hy,o.segs[0].x,o.segs[0].y);
      if(o.segs.length > myLen*0.8 && d < 220*220){ if(d<threatD){threatD=d;threat=o;} }
    });

    // 2. Scan for prey (smaller snakes we can cut off)
    let prey=null, preyD=Infinity;
    snakes.forEach(o=>{
      if(o===s||!o.alive)return;
      const d=dist2(hx,hy,o.segs[0].x,o.segs[0].y);
      if(o.segs.length < myLen*0.75 && d < 300*300){ if(d<preyD){preyD=d;prey=o;} }
    });

    // 3. Nearest food cluster (pick best within 400px)
    let bestFood=null, bestFD=Infinity;
    food.forEach(f=>{
      const d=dist2(hx,hy,f.x,f.y);
      if(d<bestFD){ bestFD=d; bestFood=f; }
    });
    // also check death orbs (very attractive)
    deathOrbs.forEach(f=>{
      const d=dist2(hx,hy,f.x,f.y)*0.2; // weight orbs 5x
      if(d<bestFD){ bestFD=d; bestFood=f; }
    });

    // 4. Wall avoidance — steer away from edges
    const WALL=180;
    let wallSteer = 0;
    if(hx < WALL)       wallSteer += (WALL-hx)/WALL * 1.2;
    if(hx > WW-WALL)    wallSteer -= (hx-(WW-WALL))/WALL * 1.2;
    if(hy < WALL)       wallSteer += (WALL-hy)/WALL * 0.6;
    if(hy > WH-WALL)    wallSteer -= (hy-(WH-WALL))/WALL * 0.6;

    // 5. Body avoidance (don't overlap own body segments)
    let bodySteer=0;
    for(let i=8;i<s.segs.length;i+=4){
      const seg=s.segs[i], d=Math.hypot(hx-seg.x,hy-seg.y);
      if(d<40){ const a=Math.atan2(hy-seg.y,hx-seg.x); bodySteer+=(40-d)/40*Math.sin(a-s.angle)*0.8; }
    }

    // Decide target angle
    let tAngle = s.angle;

    if(threat){
      // FLEE: turn away from threat
      const away = Math.atan2(hy-threat.segs[0].y, hx-threat.segs[0].x);
      tAngle = away + wallSteer + bodySteer;
      s.boosting = threatD < 120*120;
      s.aiMode='flee';
    } else if(prey && Math.random()<0.4){
      // INTERCEPT prey: aim slightly ahead of prey's movement
      const ph=prey.segs[0], ph2=prey.segs[Math.min(4,prey.segs.length-1)];
      const pvx=(ph.x-ph2.x)*6, pvy=(ph.y-ph2.y)*6;
      const interceptX=ph.x+pvx, interceptY=ph.y+pvy;
      tAngle = Math.atan2(interceptY-hy, interceptX-hx) + wallSteer*0.5;
      s.boosting = preyD < 100*100;
      s.aiMode='hunt';
    } else if(bestFood){
      // SEEK food
      tAngle = Math.atan2(bestFood.y-hy, bestFood.x-hx) + wallSteer + bodySteer;
      s.boosting = bestFD < 60*60 && Math.random()<0.3;
      s.aiMode='food';
    } else {
      // WANDER in a smooth curve
      tAngle = s.angle + (Math.random()-0.5)*0.4 + wallSteer;
      s.boosting=false;
      s.aiMode='wander';
    }

    s.targetAngle = tAngle;
  }

  /* ── Angular lerp ── */
  function lerpAngle(a,b,t){
    let d=b-a;
    while(d>Math.PI)d-=Math.PI*2;
    while(d<-Math.PI)d+=Math.PI*2;
    return a+d*t;
  }
  function dist2(ax,ay,bx,by){return (ax-bx)**2+(ay-by)**2;}

  /* ── Init ── */
  function init(){
    snakes=[mkSnake(true,0), ...Array.from({length:BOT_COUNT},(_,i)=>mkSnake(false,i))];
    food=mkFood(); deathOrbs=[]; score=0; running=true; frame=0;
    setScore(0); hideGover();
    playerColor=playerColors['snakeio'];
    snakes[0].color=playerColor; snakes[0].darkColor=darken(playerColor,.45);
  }

  /* ── Main loop ── */
  let last=0;
  function loop(ts){
    if(!running)return;
    raf=requestAnimationFrame(loop);
    const dt=Math.min(ts-last,50); last=ts; frame++;

    const player=snakes[0];
    if(!player.alive){ running=false; showGover('GAME OVER','Score: '+score,()=>init()); return; }

    /* ─ Player steering ─ */
    player.targetAngle = mouseAngle;
    player.boosting = boosting;

    /* ─ Update all snakes ─ */
    snakes.forEach(s=>{
      if(!s.alive)return;
      if(!s.isPlayer) botAI(s,dt);

      // smooth turn
      const turnRate = s.isPlayer ? 0.12 : 0.07+Math.random()*0.04;
      s.angle = lerpAngle(s.angle, s.targetAngle, turnRate);

      const spd = (s.boosting ? BASE_SPEED*BOOST_MULT : BASE_SPEED) * (dt/16);

      // move head
      const hx = s.segs[0].x + Math.cos(s.angle)*spd;
      const hy = s.segs[0].y + Math.sin(s.angle)*spd;

      // wall wrap / kill
      if(hx<0||hx>WW||hy<0||hy>WH){
        if(s.isPlayer){ running=false; showGover('GAME OVER','Score: '+score,()=>init()); return; }
        s.alive=false; dropOrbs(s); respawn(s); return;
      }

      s.segs.unshift({x:hx,y:hy});

      // trim tail (target length = base + score * growth)
      const targetLen = (s.isPlayer?20:16) + s.score*2;
      while(s.segs.length > targetLen) s.segs.pop();

      // eat food
      const eatR = s.r+6;
      for(let i=food.length-1;i>=0;i--){
        const f=food[i];
        if((hx-f.x)**2+(hy-f.y)**2 < eatR*eatR){
          s.score++; if(s.isPlayer){score++;setScore(score);}
          food.splice(i,1);
          food.push({x:50+Math.random()*(WW-100),y:50+Math.random()*(WH-100),color:BOTCOLS[~~(Math.random()*BOTCOLS.length)],r:4+Math.random()*4,pulse:Math.random()*Math.PI*2});
        }
      }
      // eat death orbs
      for(let i=deathOrbs.length-1;i>=0;i--){
        const f=deathOrbs[i];
        if((hx-f.x)**2+(hy-f.y)**2 < eatR*eatR){
          s.score+=3; if(s.isPlayer){score+=3;setScore(score);}
          deathOrbs.splice(i,1);
        }
      }
    });

    /* ─ Collision between snakes ─ */
    const player2=snakes[0];
    if(player2.alive){
      const phx=player2.segs[0].x, phy=player2.segs[0].y;
      snakes.forEach(o=>{
        if(!o.alive||o===player2)return;
        // check player head vs other body
        for(let i=0;i<o.segs.length;i++){
          const seg=o.segs[i];
          if((phx-seg.x)**2+(phy-seg.y)**2 < (player2.r+o.r*0.8)**2){
            running=false; showGover('GAME OVER','Score: '+score,()=>init()); return;
          }
        }
      });
    }

    // Bot head vs other snake bodies
    snakes.forEach(s=>{
      if(!s.alive||s.isPlayer)return;
      const shx=s.segs[0].x, shy=s.segs[0].y;
      snakes.forEach(o=>{
        if(!o.alive||o===s)return;
        for(let i=5;i<o.segs.length;i+=3){
          const seg=o.segs[i];
          if((shx-seg.x)**2+(shy-seg.y)**2 < (s.r+o.r*0.7)**2){
            s.alive=false; dropOrbs(s); respawn(s); return;
          }
        }
      });
    });

    /* ─ Camera follow player ─ */
    if(player2.alive){
      camX += (player2.segs[0].x - W/2 - camX)*0.09;
      camY += (player2.segs[0].y - H/2 - camY)*0.09;
      camX=Math.max(0,Math.min(WW-W,camX));
      camY=Math.max(0,Math.min(WH-H,camY));
    }

    /* ─ Draw ─ */
    drawScene();
  }

  function dropOrbs(s){
    const n=Math.min(s.segs.length, 60);
    for(let i=0;i<n;i+=2){
      const seg=s.segs[~~(Math.random()*s.segs.length)];
      deathOrbs.push({x:seg.x+(Math.random()-0.5)*20, y:seg.y+(Math.random()-0.5)*20, color:s.color, r:4+Math.random()*5, pulse:Math.random()*Math.PI*2});
    }
  }
  function respawn(s){
    const margin=200;
    const sx=margin+Math.random()*(WW-margin*2), sy=margin+Math.random()*(WH-margin*2);
    const angle=Math.random()*Math.PI*2;
    s.segs=[];
    for(let i=0;i<16;i++) s.segs.push({x:sx-Math.cos(angle)*i*SEG_DIST,y:sy-Math.sin(angle)*i*SEG_DIST});
    s.angle=angle; s.targetAngle=angle; s.alive=true; s.score=0;
  }

  function drawScene(){
    /* Background — dark grid like slither.io */
    ctx.fillStyle='#0a0a14';
    ctx.fillRect(0,0,W,H);

    // grid dots
    const gs=40;
    ctx.fillStyle='rgba(255,255,255,0.06)';
    const ox=camX%gs, oy=camY%gs;
    for(let x=-ox;x<W+gs;x+=gs)
      for(let y=-oy;y<H+gs;y+=gs){
        ctx.beginPath(); ctx.arc(x,y,1.5,0,Math.PI*2); ctx.fill();
      }

    // world boundary glow
    const bx=-camX, by=-camY;
    ctx.save();
    ctx.strokeStyle='rgba(255,79,123,0.5)'; ctx.lineWidth=6;
    ctx.shadowBlur=18; ctx.shadowColor='#ff4f7b';
    ctx.strokeRect(bx,by,WW,WH);
    ctx.restore();

    /* Food pulses */
    food.forEach(f=>{
      f.pulse+=0.06;
      const sx=f.x-camX, sy=f.y-camY;
      if(sx<-20||sx>W+20||sy<-20||sy>H+20)return;
      const r=f.r+Math.sin(f.pulse)*1.5;
      ctx.save();
      ctx.shadowBlur=12; ctx.shadowColor=f.color;
      // outer glow ring
      ctx.beginPath(); ctx.arc(sx,sy,r+3,0,Math.PI*2);
      ctx.fillStyle=hexA(f.color,0.2); ctx.fill();
      // core
      ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
      ctx.fillStyle=f.color; ctx.fill();
      // shine
      ctx.beginPath(); ctx.arc(sx-r*.3,sy-r*.3,r*.35,0,Math.PI*2);
      ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.fill();
      ctx.restore();
    });

    /* Death orbs (larger, more sparkly) */
    deathOrbs.forEach(f=>{
      f.pulse+=0.08;
      const sx=f.x-camX, sy=f.y-camY;
      if(sx<-20||sx>W+20||sy<-20||sy>H+20)return;
      const r=f.r+Math.sin(f.pulse)*2;
      ctx.save();
      ctx.shadowBlur=18; ctx.shadowColor=f.color;
      ctx.beginPath(); ctx.arc(sx,sy,r+4,0,Math.PI*2);
      ctx.fillStyle=hexA(f.color,0.15); ctx.fill();
      ctx.beginPath(); ctx.arc(sx,sy,r,0,Math.PI*2);
      ctx.fillStyle=f.color; ctx.fill();
      // sparkle cross
      ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.lineWidth=1;
      const sp=r+5;
      ctx.beginPath(); ctx.moveTo(sx-sp,sy); ctx.lineTo(sx+sp,sy);
      ctx.moveTo(sx,sy-sp); ctx.lineTo(sx,sy+sp); ctx.stroke();
      ctx.restore();
    });

    /* Snakes */
    // draw all snakes back-to-front
    [...snakes].reverse().forEach(s=>{
      if(!s.alive)return;
      drawSnake(s);
    });

    /* HUD */
    drawHUD();
    drawMinimap();
  }

  function drawSnake(s){
    const segs=s.segs;
    if(!segs.length)return;
    const col=s.isPlayer?(playerColor||s.color):s.color;
    const dark=s.isPlayer?darken(playerColor||s.color,.45):s.darkColor;

    // Draw body as connected circles with outline
    // outline pass first
    ctx.save();
    ctx.strokeStyle=dark; ctx.lineWidth=s.r*2+4;
    ctx.lineCap='round'; ctx.lineJoin='round';
    ctx.beginPath();
    const startIdx=Math.min(segs.length-1,1);
    ctx.moveTo(segs[startIdx].x-camX, segs[startIdx].y-camY);
    for(let i=startIdx+1;i<segs.length;i++) ctx.lineTo(segs[i].x-camX, segs[i].y-camY);
    ctx.stroke();

    // body fill pass
    ctx.strokeStyle=col; ctx.lineWidth=s.r*2;
    ctx.beginPath();
    ctx.moveTo(segs[startIdx].x-camX, segs[startIdx].y-camY);
    for(let i=startIdx+1;i<segs.length;i++) ctx.lineTo(segs[i].x-camX, segs[i].y-camY);
    ctx.stroke();
    ctx.restore();

    // scale pattern — draw dots along body every ~16px
    for(let i=4;i<segs.length-2;i+=6){
      const seg=segs[i], prev=segs[i-1];
      const sx=seg.x-camX, sy=seg.y-camY;
      if(sx<-s.r*3||sx>W+s.r*3||sy<-s.r*3||sy>H+s.r*3)continue;
      ctx.save();
      ctx.fillStyle=hexA(dark,0.5);
      ctx.beginPath(); ctx.arc(sx,sy,s.r*.4,0,Math.PI*2); ctx.fill();
      ctx.restore();
    }

    /* Head */
    const hx=segs[0].x-camX, hy=segs[0].y-camY;
    if(hx<-40||hx>W+40||hy<-40||hy>H+40) return;

    // head glow on boost
    if(s.boosting){
      ctx.save(); ctx.shadowBlur=20; ctx.shadowColor=col;
      ctx.beginPath(); ctx.arc(hx,hy,s.r+4,0,Math.PI*2);
      ctx.fillStyle=hexA(col,0.3); ctx.fill(); ctx.restore();
    }

    // head circle outline
    ctx.save();
    ctx.shadowBlur=s.isPlayer?18:8; ctx.shadowColor=col;
    ctx.fillStyle=dark; ctx.beginPath(); ctx.arc(hx,hy,s.r+2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=col; ctx.beginPath(); ctx.arc(hx,hy,s.r,0,Math.PI*2); ctx.fill();
    ctx.restore();

    // eyes
    const ea=s.angle;
    const eyeOff=s.r*0.55, eyeR=s.r*0.28;
    const ex1=hx+Math.cos(ea-0.5)*eyeOff, ey1=hy+Math.sin(ea-0.5)*eyeOff;
    const ex2=hx+Math.cos(ea+0.5)*eyeOff, ey2=hy+Math.sin(ea+0.5)*eyeOff;
    ctx.fillStyle='#fff';
    ctx.beginPath(); ctx.arc(ex1,ey1,eyeR,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2,ey2,eyeR,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#111';
    const pupilOff=eyeR*0.35;
    ctx.beginPath(); ctx.arc(ex1+Math.cos(ea)*pupilOff,ey1+Math.sin(ea)*pupilOff,eyeR*.55,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(ex2+Math.cos(ea)*pupilOff,ey2+Math.sin(ea)*pupilOff,eyeR*.55,0,Math.PI*2); ctx.fill();

    // tongue flick every 30 frames
    if(s.isPlayer && frame%30<8){
      ctx.save(); ctx.strokeStyle='#ff4466'; ctx.lineWidth=1.5;
      const tk=frame%30; const fk=tk<4?tk/4:1-(tk-4)/4;
      const tx1=hx+Math.cos(ea)*(s.r+8*fk), ty1=hy+Math.sin(ea)*(s.r+8*fk);
      ctx.beginPath(); ctx.moveTo(hx+Math.cos(ea)*s.r,hy+Math.sin(ea)*s.r); ctx.lineTo(tx1,ty1);
      ctx.moveTo(tx1,ty1); ctx.lineTo(tx1+Math.cos(ea-0.5)*5*fk,ty1+Math.sin(ea-0.5)*5*fk);
      ctx.moveTo(tx1,ty1); ctx.lineTo(tx1+Math.cos(ea+0.5)*5*fk,ty1+Math.sin(ea+0.5)*5*fk);
      ctx.stroke(); ctx.restore();
    }

    // name tag
    ctx.save();
    ctx.font=`bold ${s.isPlayer?12:10}px 'Rajdhani',sans-serif`;
    ctx.textAlign='center'; ctx.textBaseline='bottom';
    const tagY=hy-s.r-6;
    ctx.fillStyle='rgba(0,0,0,0.55)';
    const tw=ctx.measureText(s.name).width;
    ctx.fillRect(hx-tw/2-4,tagY-14,tw+8,16);
    ctx.fillStyle=s.isPlayer?'#fff':col;
    ctx.shadowBlur=s.isPlayer?8:0; ctx.shadowColor=col;
    ctx.fillText(s.name,hx,tagY);
    // length badge
    ctx.font=`bold 9px 'Rajdhani',sans-serif`;
    ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText(s.segs.length,hx,tagY-16);
    ctx.restore();
  }

  function drawHUD(){
    /* Score + length bar top-left */
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(10,10,160,54);
    ctx.strokeStyle='rgba(255,255,255,0.08)'; ctx.lineWidth=1; ctx.strokeRect(10,10,160,54);
    ctx.font='bold 11px "Press Start 2P"';
    ctx.fillStyle=playerColor||'#3df5c1'; ctx.shadowBlur=6; ctx.shadowColor=playerColor||'#3df5c1';
    ctx.fillText('SCORE',18,30); ctx.fillStyle='#fff'; ctx.shadowBlur=0;
    ctx.font='bold 16px "Press Start 2P"'; ctx.fillText(score,18,52);
    ctx.restore();

    /* Boost indicator bottom-center */
    if(boosting){
      ctx.save(); ctx.font='bold 10px "Press Start 2P"'; ctx.textAlign='center';
      ctx.fillStyle=playerColor||'#f0c040'; ctx.shadowBlur=12; ctx.shadowColor=playerColor||'#f0c040';
      ctx.fillText('⚡ BOOST',W/2,H-18); ctx.restore();
    }

    /* Leaderboard top-right */
    const lb=[...snakes].filter(s=>s.alive).sort((a,b)=>b.segs.length-a.segs.length).slice(0,8);
    const lbW=154, lbH=lb.length*22+32;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.58)'; ctx.fillRect(W-lbW-10,10,lbW,lbH);
    ctx.strokeStyle='rgba(255,255,255,0.07)'; ctx.lineWidth=1; ctx.strokeRect(W-lbW-10,10,lbW,lbH);
    ctx.font='bold 8px "Press Start 2P"'; ctx.fillStyle='rgba(255,255,255,0.4)'; ctx.textAlign='center';
    ctx.fillText('LEADERBOARD',W-lbW/2-10,28);
    lb.forEach((s,i)=>{
      const isy=s.isPlayer;
      const col2=isy?'#fff':s.color;
      ctx.fillStyle=isy?'rgba(255,255,255,0.12)':'transparent';
      if(isy) ctx.fillRect(W-lbW-10,36+i*22,lbW,22);
      // rank dot
      ctx.fillStyle=s.color; ctx.shadowBlur=4; ctx.shadowColor=s.color;
      ctx.beginPath(); ctx.arc(W-lbW+2,47+i*22,5,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
      ctx.font=`${isy?'bold ':''} 9px "Press Start 2P"`;
      ctx.fillStyle=col2; ctx.textAlign='left';
      const nm=s.name.length>5?s.name.slice(0,5):s.name;
      ctx.fillText(`${i+1}.${nm}`,W-lbW+12,50+i*22);
      ctx.textAlign='right'; ctx.fillStyle='rgba(255,255,255,0.6)';
      ctx.fillText(s.segs.length,W-14,50+i*22);
    });
    ctx.restore();
  }

  function drawMinimap(){
    const mmS=120, mmX=W-mmS-10, mmY=H-mmS-10;
    const sx=WW/mmS, sy=WH/mmS;
    ctx.save();
    ctx.fillStyle='rgba(0,0,0,0.6)'; ctx.fillRect(mmX,mmY,mmS,mmS);
    ctx.strokeStyle='rgba(255,255,255,0.1)'; ctx.lineWidth=1; ctx.strokeRect(mmX,mmY,mmS,mmS);
    // food dots
    food.forEach(f=>{ ctx.fillStyle=hexA(f.color,0.5); ctx.fillRect(mmX+f.x/sx,mmY+f.y/sy,1.5,1.5); });
    // snakes
    snakes.forEach(s=>{
      if(!s.alive)return;
      const h=s.segs[0];
      ctx.fillStyle=s.isPlayer?'#fff':s.color;
      ctx.shadowBlur=s.isPlayer?6:0; ctx.shadowColor=s.isPlayer?s.color:'';
      ctx.beginPath(); ctx.arc(mmX+h.x/sx,mmY+h.y/sy,s.isPlayer?3.5:2,0,Math.PI*2); ctx.fill();
      ctx.shadowBlur=0;
    });
    // viewport rect
    ctx.strokeStyle='rgba(255,255,255,0.35)'; ctx.lineWidth=1;
    ctx.strokeRect(mmX+camX/sx,mmY+camY/sy,W/sx,H/sy);
    ctx.restore();
  }

  /* ── Input ── */
  const onMouseMove=e=>{
    const r=canvas.getBoundingClientRect();
    const mx=e.clientX-r.left, my=e.clientY-r.top;
    mouseAngle=Math.atan2(my-H/2, mx-W/2);
  };
  const onKeyD=e=>{if(e.code==='Space'){e.preventDefault();boosting=true;}};
  const onKeyU=e=>{if(e.code==='Space')boosting=false;};
  const onMouseDown=e=>{if(e.button===0)boosting=true;};
  const onMouseUp=e=>{if(e.button===0)boosting=false;};

  canvas.addEventListener('mousemove',onMouseMove);
  document.addEventListener('keydown',onKeyD);
  document.addEventListener('keyup',onKeyU);
  canvas.addEventListener('mousedown',onMouseDown);
  canvas.addEventListener('mouseup',onMouseUp);
  canvas.style.cursor='none';

  init(); raf=requestAnimationFrame(loop);
  return{
    stop(){running=false;cancelAnimationFrame(raf);canvas.removeEventListener('mousemove',onMouseMove);document.removeEventListener('keydown',onKeyD);document.removeEventListener('keyup',onKeyU);canvas.removeEventListener('mousedown',onMouseDown);canvas.removeEventListener('mouseup',onMouseUp);canvas.style.cursor='';},
    setColor(c){playerColor=c;if(snakes&&snakes[0]){snakes[0].color=c;snakes[0].darkColor=darken(c,.45);}},
    setSpeed(){}
  };
}

/* ══════════════════════════════════════════
   GAME: SUPER MARIO (platformer)
══════════════════════════════════════════ */
function gameMario(canvas,W){
  /* Full Super Mario remake – proper sprites, parallax BG,
     pipes, ? blocks, Goombas, Koopas, particles, mobile D-pad */
  const H=~~(W*0.6); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const GR=~~(W/20), GRAV=0.55, JMP=-13, SPD=4.4, WW=W*6;
  let pl,platforms,enemies,coins,pipes,qblks,parts,score,lives,camX,state,t,color,keys={};
  let tL=false,tR=false,tJ=false;

  /* helpers */
  function r(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(~~x,~~y,~~w,~~h);}
  function col(ax,ay,aw,ah,bx,by,bw,bh){return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;}

  /* ── Player sprite (pixel-art Mario) ── */
  function drawPlayer(x,y){
    if(pl.inv>0&&~~(t/5)%2)return;
    const pw=pl.w, ph=pl.h, big=pl.big;
    const walk=pl.onGround&&Math.abs(pl.vx)>.4;
    const leg=walk?Math.sin(t*.18)*.3:0;
    const flip=pl.vx<-.1;
    ctx.save(); if(flip){ctx.translate(~~(x+pw),0);ctx.scale(-1,1);x=0;}
    x=~~x; y=~~y;
    /* hat */      r(x+pw*.22,y,           pw*.56,ph*.18, color);
                   r(x+pw*.08,y+ph*.18,    pw*.84,ph*.10, color);
    /* face */     r(x+pw*.18,y+ph*.18,    pw*.64,ph*.26, '#f4c48a');
    /* eye  */     r(x+pw*.6, y+ph*.22,    pw*.16,ph*.12, '#111');
    /* moustache */r(x+pw*.12,y+ph*.36,    pw*.76,ph*.10, '#5a2800');
    /* shirt */    r(x+pw*.04,y+ph*.46,    pw*.92,ph*.28, color);
    /* overalls */ r(x+pw*.12,y+ph*.46,    pw*.76,ph*.28, '#2255cc');
    r(x+pw*.28,y+ph*.48,pw*.18,ph*.08,'#f4c48a');
    r(x+pw*.54,y+ph*.48,pw*.18,ph*.08,'#f4c48a');
    /* sleeves */  r(x,       y+ph*.46,    pw*.14,ph*.22, color);
                   r(x+pw*.86,y+ph*.46,    pw*.14,ph*.22, color);
    /* hands  */   r(x-pw*.04,y+ph*.64,    pw*.18,ph*.12, '#f4c48a');
                   r(x+pw*.86,y+ph*.64,    pw*.18,ph*.12, '#f4c48a');
    /* legs   */   r(x+pw*.08+leg*pw*.5, y+ph*.74, pw*.36,ph*.18,'#2255cc');
                   r(x+pw*.56-leg*pw*.5, y+ph*.74, pw*.36,ph*.18,'#2255cc');
    /* shoes  */   r(x+pw*.04+leg*pw*.5, y+ph*.88, pw*.42,ph*.14,'#5a2800');
                   r(x+pw*.52-leg*pw*.5, y+ph*.88, pw*.42,ph*.14,'#5a2800');
    ctx.restore();
  }

  /* ── Goomba ── */
  function drawGoomba(e){
    const sq=e.sq>0, x=~~(e.x-camX), y=~~e.y, w=e.w, h=sq?~~(e.h*.35):e.h;
    const yo=sq?~~(e.h*.65):0;
    r(x,      y+yo+h*.28, w,    h*.72, '#8b4513');
    r(x+w*.1, y+yo,       w*.8, h*.38, '#5a2d0c');
    r(x,      y+yo+h*.85, w*.4, h*.15, '#5a2d0c');
    r(x+w*.6, y+yo+h*.85, w*.4, h*.15, '#5a2d0c');
    if(!sq){
      r(x+w*.1, y+yo+h*.08, w*.28,h*.22,'#fff'); r(x+w*.62,y+yo+h*.08,w*.28,h*.22,'#fff');
      r(x+w*.16,y+yo+h*.14, w*.15,h*.14,'#111'); r(x+w*.68,y+yo+h*.14,w*.15,h*.14,'#111');
      ctx.strokeStyle='#111';ctx.lineWidth=1.5;
      ctx.beginPath();ctx.moveTo(x+w*.1,y+yo+h*.06);ctx.lineTo(x+w*.38,y+yo+h*.15);ctx.stroke();
      ctx.beginPath();ctx.moveTo(x+w*.9,y+yo+h*.06);ctx.lineTo(x+w*.62,y+yo+h*.15);ctx.stroke();
    }
  }

  /* ── Koopa ── */
  function drawKoopa(e){
    const x=~~(e.x-camX), y=~~e.y, fl=e.vx<0;
    if(e.shell){
      r(x+GR*.08,y+GR*.18,GR*.84,GR*.82,'#3a7a0e');
      r(x+GR*.2, y+GR*.26,GR*.6, GR*.62,'#5aaa20');
      r(x+GR*.42,y+GR*.28,GR*.16,GR*.16,'#fff'); return;
    }
    r(x+GR*.08,y+GR*.28,GR*.84,GR*.72,'#3a7a0e');
    r(x+GR*.1, y+GR*.16,GR*.8, GR*.64,'#5aaa20');
    r(x+GR*.24,y+GR*.22,GR*.52,GR*.46,'#78cc30');
    const hx=fl?GR*.06:GR*.22;
    r(x+hx,y,GR*.62,GR*.34,'#5aaa20');
    r(x+hx+(fl?GR*.04:GR*.36),y+GR*.06,GR*.18,GR*.14,'#fff');
    r(x+hx+(fl?GR*.08:GR*.4), y+GR*.1, GR*.1, GR*.1,'#111');
    r(x,      y+GR*.88,GR*.28,GR*.12,'#3a7a0e');
    r(x+GR*.72,y+GR*.88,GR*.28,GR*.12,'#3a7a0e');
  }

  /* ── ? Block ── */
  function drawQBlk(q){
    const sx=~~(q.x-camX), sy=~~q.y;
    const bob=q.used?0:Math.sin(t*.1)*1.5;
    r(sx,sy-bob,GR,GR+bob, q.used?'#b89050':'#e8a020');
    ctx.strokeStyle=q.used?'#806020':'#ffe060';ctx.lineWidth=2;
    ctx.strokeRect(sx+1,sy-bob+1,GR-2,GR-2);
    if(!q.used){ctx.fillStyle='#fffaa0';ctx.font=`bold ${~~(GR*.68)}px sans-serif`;
      ctx.textAlign='center';ctx.fillText('?',sx+GR/2,sy-bob+GR*.8);ctx.textAlign='left';}
  }

  /* ── Pipe ── */
  function drawPipe(p){
    const sx=~~(p.x-camX);
    r(sx,       p.y,       GR*2,   p.h,   '#1a7a10');
    r(sx+GR*.06,p.y,       GR*1.88,p.h,   '#22a015');
    r(sx-GR*.1, p.y,       GR*2.2, GR*.52,'#1a7a10');
    r(sx+GR*.06,p.y+GR*.08,GR*.2,  p.h-GR*.1,'#3acc28');
  }

  /* ── Coin ── */
  function drawCoin(x,y,sz){
    sz=sz||GR*.7;
    ctx.save();ctx.translate(~~(x+sz*.5),~~(y+sz*.5));
    ctx.scale(Math.abs(Math.cos(t*.055))*.55+.45,1);
    ctx.beginPath();ctx.arc(0,0,sz*.54,0,Math.PI*2);ctx.fillStyle='#f0c040';ctx.fill();
    ctx.beginPath();ctx.arc(0,0,sz*.36,0,Math.PI*2);ctx.fillStyle='#f8e060';ctx.fill();
    ctx.restore();
  }

  /* ── Particle burst ── */
  function burst(x,y,col,n=8){
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,sp=1.5+Math.random()*4;
      parts.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp-2.5,col,life:1,sz:2+Math.random()*4,type:'dot'});}
  }
  function popCoin(x,y){
    parts.push({x,y,vx:0,vy:-7.5,col:'#f0c040',life:1.2,sz:GR*.52,type:'coin'});
    parts.push({x,y:y-14,vx:0,vy:-.5,col:'#fff',life:1.5,sz:9,type:'txt',txt:'+100'});
  }

  /* ── Parallax background ── */
  function drawBG(){
    const sg=ctx.createLinearGradient(0,0,0,H);
    sg.addColorStop(0,'#5c94fc');sg.addColorStop(1,'#8ab8ff');
    ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);
    /* clouds */
    ctx.fillStyle='rgba(255,255,255,.92)';
    [[.04,.1,1.1],[.16,.07,.85],[.33,.12,1.35],[.54,.07,.95],[.71,.1,1.25],[.87,.08,.75]].forEach(([rx,ry,sc])=>{
      const cx2=((rx*WW-camX*.27)%WW+WW)%WW/WW*W, cy2=ry*H*.52, cr=sc*W*.054;
      [[-cr*.6,0,cr],[0,-cr*.43,cr*1.28],[cr*.6,0,cr]].forEach(([ox,oy,rr])=>{
        ctx.beginPath();ctx.arc(cx2+ox,cy2+oy,rr,0,Math.PI*2);ctx.fill();});});
    /* hills */
    [[.08,.74,.11],[.26,.71,.17],[.44,.73,.1],[.61,.7,.15],[.79,.72,.12]].forEach(([rx,ry,sc])=>{
      const hx=((rx*WW-camX*.47)%WW+WW)%WW/WW*W;
      ctx.fillStyle='#54a82a';ctx.beginPath();ctx.arc(hx,ry*H,sc*W,Math.PI,0);ctx.fill();});
  }

  /* ── Level ── */
  function mkLevel(){
    platforms=[];pipes=[];qblks=[];
    /* ground – with gap near flag */
    for(let x=0;x<WW-GR*5.5;x+=GR) platforms.push({x,y:H-GR,w:GR,h:GR,type:'gnd'});
    /* brick rows */
    [[8,8,4],[14,8,3],[20,8,5],[28,7,4],[36,9,3],[44,8,4],[52,7,5],[60,8,4],
     [68,9,3],[76,8,5],[84,7,4],[92,8,3],[100,9,5],[108,8,4],[116,7,3]].forEach(([bx,by,bw])=>{
      for(let i=0;i<bw;i++) platforms.push({x:(bx+i)*GR,y:H-by*GR,w:GR,h:GR,type:'brk'});});
    /* ? blocks */
    [[10,7],[15,7],[21,7],[29,6],[37,8],[50,7],[63,7],[77,6],[91,7],[105,8]].forEach(([qx,qy])=>{
      qblks.push({x:qx*GR,y:H-qy*GR,used:false});});
    /* pipes */
    [[18,3],[30,4],[42,3],[58,4],[72,3],[88,4],[102,3]].forEach(([px,ph])=>{
      pipes.push({x:px*GR,y:H-(ph+1)*GR,h:ph*GR});});
    /* goal pole */
    platforms.push({x:WW-GR*5,  y:H-GR*14, w:~~(GR*.22), h:GR*13, type:'pole'});
    platforms.push({x:WW-GR*5.5,y:H-GR*14, w:GR,         h:GR*.9, type:'flag'});
  }

  function mkEnemies(){
    return[
      ...[12,22,34,46,62,78,94,110].map(x=>({x:x*GR,y:H-GR*2,vx:-1.5,vy:0,type:'G',alive:true,sq:0,onGround:false,w:~~(GR*1.1),h:~~(GR*1.1)})),
      ...[25,40,55,70,85,100].map(x=>({x:x*GR,y:H-GR*2,vx:-1.2,vy:0,type:'K',alive:true,shell:false,svx:0,onGround:false,w:GR,h:GR}))];
  }
  function mkCoins(){
    return[[8,10],[10,10],[12,10],[16,10],[20,10],[24,9],[28,9],[32,9],[36,11],[40,11],[44,11],
           [48,9],[52,9],[56,9],[60,11],[64,11],[68,11],[72,9],[76,9],[80,9],
           [84,10],[88,10],[92,10],[96,9],[100,11],[104,11],[108,10],[112,10]]
      .map(([cx,cy])=>({x:cx*GR,y:H-cy*GR,alive:true}));
  }

  function init(){
    mkLevel(); enemies=mkEnemies(); coins=mkCoins(); parts=[];
    pl={x:GR*2,y:H-GR*4,vx:0,vy:0,w:~~(GR*1.2),h:~~(GR*1.85),onGround:false,big:false,inv:0};
    score=0;lives=3;camX=0;state='play';t=0;
    setScore(0);hideGover();
  }

  function getSolids(){
    return[...platforms,
      ...pipes.map(p=>({x:p.x-GR*.12,y:p.y,w:GR*2.24,h:p.h+GR,type:'pipe'})),
      ...qblks.map(q=>({x:q.x,y:q.y,w:GR,h:GR,type:'qb',ref:q}))];
  }

  function movePlayer(){
    pl.vy=Math.min(pl.vy+GRAV,18);
    const solids=getSolids();
    pl.y+=pl.vy; pl.onGround=false;
    for(const s of solids){
      if(!col(pl.x,pl.y,pl.w,pl.h,s.x,s.y,s.w,s.h))continue;
      if(pl.vy>=0){pl.y=s.y-pl.h;pl.vy=0;pl.onGround=true;}
      else{
        if(s.type==='qb'&&s.ref&&!s.ref.used){
          s.ref.used=true;score+=100;setScore(score);popCoin(s.ref.x+GR/2,s.ref.y);}
        pl.y=s.y+s.h;pl.vy=1;
      }
    }
    pl.x+=pl.vx;
    for(const s of solids){
      if(!col(pl.x,pl.y,pl.w,pl.h,s.x,s.y,s.w,s.h))continue;
      pl.x=pl.vx>0?s.x-pl.w:s.x+s.w; pl.vx=0;
    }
    if(pl.x<0)pl.x=0;
    if(pl.y>H+GR*3){lives--;if(lives<=0){state='over';showGover();}else{pl.x=GR*2;pl.y=H-GR*4;pl.vx=0;pl.vy=0;}}
    if(pl.x>WW-GR*6){state='win';showGover();}
  }

  function moveEnemy(e){
    if(!e.alive)return;
    e.vy=Math.min(e.vy+GRAV,18);
    const solids=getSolids();
    e.y+=e.vy; e.onGround=false;
    for(const s of solids){
      if(!col(e.x,e.y,e.w,e.h,s.x,s.y,s.w,s.h))continue;
      if(e.vy>=0){e.y=s.y-e.h;e.vy=0;e.onGround=true;}else{e.y=s.y+s.h;e.vy=1;}
    }
    e.x+=(e.shell?e.svx:e.vx);
    for(const s of solids){
      if(!col(e.x,e.y,e.w,e.h,s.x,s.y,s.w,s.h)){continue;}
      e.vx*=-1;e.svx*=-1;e.x+=e.vx*2;break;
    }
    if(e.x<-GR*2||e.x>WW+GR*2)e.alive=false;
  }

  function hitEnemies(){
    for(const e of enemies){
      if(!e.alive)continue;
      if(!col(pl.x,pl.y,pl.w,pl.h,e.x,e.y,e.w,e.h))continue;
      const stomp=pl.vy>0&&(pl.y+pl.h)<(e.y+e.h*.55);
      if(stomp){
        if(e.type==='G'){e.sq=35;setTimeout(()=>{e.alive=false;},380);}
        else if(e.shell){e.svx=e.x<pl.x?-7:7;}
        else{e.shell=true;e.vx=0;}
        pl.vy=-9;score+=200;setScore(score);
        burst(e.x+e.w/2,e.y+e.h/2,'#c84820');
      } else if(pl.inv<=0){
        if(pl.big){pl.big=false;pl.h=~~(GR*1.85);pl.inv=180;burst(pl.x+pl.w/2,pl.y,'#ff5555',6);}
        else{lives--;pl.inv=180;pl.x=GR*2;pl.y=H-GR*4;pl.vx=0;pl.vy=0;if(lives<=0){state='over';showGover();}}
      }
    }
  }

  /* ── HUD ── */
  function drawHUD(){
    const fs=Math.max(8,~~(W*.026));
    ctx.font=`bold ${fs}px "Press Start 2P"`;
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(6,6,~~(W*.23),fs*4.2);
    ctx.fillStyle='#f0c040';ctx.fillText('SCORE',12,fs*1.7);
    ctx.fillStyle='#fff';ctx.fillText(String(score).padStart(7,'0'),12,fs*3.1);
    ctx.fillStyle='rgba(0,0,0,.5)';ctx.fillRect(W-~~(W*.23)-6,6,~~(W*.23),fs*4.2);
    ctx.fillStyle='#f0c040';ctx.fillText('LIVES',W-~~(W*.22),fs*1.7);
    ctx.fillStyle='#fff';ctx.fillText('\u00d7 '+lives,W-~~(W*.22),fs*3.1);
  }

  /* ── Mobile D-pad ── */
  function setupDpad(){
    if(document.getElementById('mario-dpad'))return;
    const d=document.createElement('div'); d.id='mario-dpad';
    const bs='background:rgba(0,0,0,.45);border:2px solid rgba(255,255,255,.5);color:#fff;' +
             'font-size:22px;width:64px;height:64px;border-radius:12px;cursor:pointer;' +
             'touch-action:none;user-select:none;display:flex;align-items:center;justify-content:center;';
    d.style.cssText='position:fixed;bottom:12px;left:0;right:0;display:flex;align-items:flex-end;' +
      'justify-content:space-between;padding:0 18px;z-index:800;pointer-events:none;';
    d.innerHTML=`<div style="display:flex;gap:10px;pointer-events:all;">
      <button id="mbL" style="${bs}">&#9664;</button>
      <button id="mbR" style="${bs}">&#9654;</button></div>
      <button id="mbJ" style="${bs};width:70px;height:70px;border-radius:50%;font-size:16px;font-family:monospace;pointer-events:all;">JUMP</button>`;
    document.body.appendChild(d);
    function bind(id,fn){
      const el=document.getElementById(id);if(!el)return;
      el.addEventListener('touchstart',e=>{fn(true);e.preventDefault();},{passive:false});
      el.addEventListener('touchend',  e=>{fn(false);e.preventDefault();},{passive:false});
      el.addEventListener('mousedown',()=>fn(true));
      el.addEventListener('mouseup',  ()=>fn(false));
    }
    bind('mbL',v=>tL=v); bind('mbR',v=>tR=v);
    bind('mbJ',v=>{tJ=v;if(v&&pl&&pl.onGround){pl.vy=JMP;pl.onGround=false;}});
  }

  /* ── Main loop ── */
  let raf, running=true;
  function loop(){
    raf=requestAnimationFrame(loop); if(!running)return;
    t++;
    if(state==='play'){
      const left=keys['ArrowLeft']||keys['a']||keys['A']||tL;
      const right=keys['ArrowRight']||keys['d']||keys['D']||tR;
      const jump=keys['ArrowUp']||keys['w']||keys['W']||keys[' ']||tJ;
      pl.vx=right?SPD:left?-SPD:pl.vx*0.75;
      if(Math.abs(pl.vx)<.12)pl.vx=0;
      if(jump&&pl.onGround){pl.vy=JMP;pl.onGround=false;}
      movePlayer();
      /* camera smooth */
      camX+=(pl.x-W*.36-camX)*.14;
      camX=Math.max(0,Math.min(WW-W,camX));
      enemies.forEach(moveEnemy);
      hitEnemies();
      /* coins */
      for(const co of coins){
        if(!co.alive)continue;
        if(col(pl.x,pl.y,pl.w,pl.h,co.x,co.y,GR*.72,GR*.72)){
          co.alive=false;score+=100;setScore(score);popCoin(co.x,co.y);}
      }
      if(pl.inv>0)pl.inv--;
      for(const p of parts){p.x+=p.vx;p.y+=p.vy;p.vy+=p.type==='coin'?.42:.22;p.life-=.022;}
      parts=parts.filter(p=>p.life>0);
    }

    /* render */
    drawBG();
    /* ground tiles */
    for(const p of platforms){
      const sx=p.x-camX; if(sx>W+GR||sx+p.w<-GR)continue;
      if(p.type==='gnd'){
        r(sx,p.y,p.w,p.h,'#5a7a3a');
        r(sx,p.y+2,p.w,4,'#6aaa40');
        r(sx+2,p.y+~~(GR*.38),p.w-4,p.h-~~(GR*.38),'#7a5230');
      } else if(p.type==='brk'){
        r(sx,p.y,p.w,p.h,'#c84820');
        ctx.strokeStyle='#a03010';ctx.lineWidth=1.5;ctx.strokeRect(~~sx+1,p.y+1,p.w-2,p.h-2);
        r(sx+p.w*.5,p.y+1,1.5,p.h-2,'#a03010');
        r(sx+1,p.y+p.h*.5,p.w-2,1.5,'#a03010');
      } else if(p.type==='pole'){r(sx,p.y,p.w,p.h,'#c0c0c0');}
        else if(p.type==='flag'){ctx.fillStyle='#22cc22';ctx.beginPath();ctx.moveTo(sx,p.y);ctx.lineTo(sx+p.w,p.y+p.h/2);ctx.lineTo(sx,p.y+p.h);ctx.closePath();ctx.fill();}
    }
    pipes.forEach(p=>{const sx=p.x-camX;if(sx>W+GR*3||sx<-GR*3)return;drawPipe(p);});
    qblks.forEach(q=>{const sx=q.x-camX;if(sx>W+GR||sx<-GR)return;drawQBlk(q);});
    coins.forEach(co=>{if(!co.alive)return;const sx=co.x-camX;if(sx>W+GR||sx<-GR)return;drawCoin(sx,co.y);});
    enemies.forEach(e=>{
      if(!e.alive&&e.sq<=0)return;
      const sx=e.x-camX; if(sx>W+GR*2||sx<-GR*2)return;
      if(e.type==='G')drawGoomba(e); else drawKoopa(e);
      if(e.sq>0)e.sq--;
    });
    if(state==='play'||state==='win') drawPlayer(pl.x-camX,pl.y);
    /* particles */
    for(const p of parts){
      if(p.type==='txt'){
        ctx.globalAlpha=p.life*.9;ctx.fillStyle=p.col;
        ctx.font=`bold ${p.sz}px "Press Start 2P"`;
        ctx.textAlign='center';ctx.fillText(p.txt,~~p.x,~~p.y);ctx.textAlign='left';
      } else if(p.type==='coin'){drawCoin(p.x-p.sz/2,p.y,p.sz);}
      else{ctx.globalAlpha=p.life;ctx.fillStyle=p.col;ctx.beginPath();ctx.arc(~~p.x,~~p.y,p.sz,0,Math.PI*2);ctx.fill();}
      ctx.globalAlpha=1;
    }
    drawHUD();
    if(state!=='play'){
      ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,0,W,H);
      const fs=~~(W*.048); ctx.textAlign='center';
      ctx.font=`bold ${fs}px "Press Start 2P"`;
      ctx.fillStyle='#f0c040';
      ctx.fillText(state==='win'?'YOU WIN! \uD83C\uDF89':'GAME OVER',W/2,H*.42);
      ctx.font=`bold ${~~(fs*.5)}px "Press Start 2P"`;
      ctx.fillStyle='#fff';
      ctx.fillText('Score: '+score,W/2,H*.56);
      ctx.fillText('ENTER to restart',W/2,H*.67);
      ctx.textAlign='left';
    }
  }

  const kd=e=>{keys[e.key]=true;if(e.key==='Enter'&&state!=='play')init();};
  const ku=e=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);
  document.addEventListener('keyup',ku);
  setupDpad();
  color='#e03020'; running=true; init();
  raf=requestAnimationFrame(loop);

  return{
    stop(){
      running=false;cancelAnimationFrame(raf);
      document.removeEventListener('keydown',kd);
      document.removeEventListener('keyup',ku);
      tL=tR=tJ=false;
      const d=document.getElementById('mario-dpad');if(d)d.remove();
    },
    setColor(c2){color=c2;},
  };
}




function game2048(canvas,W){
  const H=W; canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const SZ=4, PAD=~~(W*0.02), GAP=~~(W*0.012);
  const cellSize=~~((W-PAD*2-GAP*(SZ+1))/(SZ));
  let board,score,best,over,won,running,color,raf;

  const TILE_COLORS={
    0:'#1a1a2e',2:'#1e3a5f',4:'#1a4a7a',8:'#f5a623',16:'#f5822a',
    32:'#e74c3c',64:'#c0392b',128:'#f1c40f',256:'#f39c12',
    512:'#d4ac0d',1024:'#d4ac0d',2048:'#27ae60',4096:'#8e44ad',
    8192:'#6c3483'
  };
  const TILE_TEXT_COLORS={0:'transparent',2:'#cce',4:'#cce',8:'#fff',16:'#fff',32:'#fff',64:'#fff',128:'#fff',256:'#fff',512:'#fff',1024:'#fff',2048:'#fff',4096:'#fff',8192:'#fff'};

  function empty(){return Array.from({length:SZ},()=>Array(SZ).fill(0));}
  function addTile(b){
    const empties=[];
    for(let r=0;r<SZ;r++)for(let cc=0;cc<SZ;cc++)if(!b[r][cc])empties.push([r,cc]);
    if(!empties.length)return;
    const[r,cc]=empties[~~(Math.random()*empties.length)];
    b[r][cc]=Math.random()<0.9?2:4;
  }
  function init(){
    board=empty();addTile(board);addTile(board);
    score=0;over=false;won=false;
    setScore(0);hideGover();
  }
  function slideRow(row){
    let r=row.filter(x=>x);
    for(let i=0;i<r.length-1;i++){
      if(r[i]===r[i+1]){r[i]*=2;score+=r[i];r[i+1]=0;}
    }
    r=r.filter(x=>x);
    while(r.length<SZ)r.push(0);
    return r;
  }
  function rotCW(b){return b[0].map((_,i)=>b.map(row=>row[i]).reverse());}
  function rotCCW(b){return b[0].map((_,i)=>b.map(row=>row[SZ-1-i]));}
  function move(dir){
    let b=board.map(r=>[...r]);
    const prev=JSON.stringify(b);
    if(dir==='left')  b=b.map(r=>slideRow(r));
    if(dir==='right') b=b.map(r=>slideRow(r.reverse()).reverse());
    if(dir==='up')    {b=rotCCW(b);b=b.map(r=>slideRow(r));b=rotCW(b);}
    if(dir==='down')  {b=rotCW(b);b=b.map(r=>slideRow(r));b=rotCCW(b);}
    if(JSON.stringify(b)!==prev){board=b;addTile(board);setScore(score);}
    // Check game over
    let moves=false;
    for(let r=0;r<SZ;r++)for(let cc=0;cc<SZ;cc++){
      if(!board[r][cc]){moves=true;break;}
      if(r<SZ-1&&board[r][cc]===board[r+1][cc]){moves=true;break;}
      if(cc<SZ-1&&board[r][cc]===board[r][cc+1]){moves=true;break;}
    }
    if(!moves){over=true;showGover();}
    if(board.some(row=>row.some(v=>v===2048)))won=true;
  }
  function draw(){
    ctx.fillStyle='#0d0b1a';ctx.fillRect(0,0,W,H);
    // Title
    const fs=~~(W*0.055);
    ctx.font=`bold ${fs}px "Press Start 2P"`;ctx.textAlign='center';
    ctx.fillStyle=color||'#f0c040';ctx.fillText('2048',W/2,fs*1.2);
    ctx.font=`${~~(W*0.025)}px "Press Start 2P"`;
    ctx.fillStyle='rgba(255,255,255,0.4)';
    ctx.fillText('merge tiles to reach 2048',W/2,fs*1.8);
    ctx.textAlign='left';
    // Board BG
    const bx=PAD, by=~~(H*0.22);
    const bw=W-PAD*2, bh=bw;
    ctx.fillStyle='#111827';
    ctx.beginPath();ctx.roundRect(bx,by,bw,bh,10);ctx.fill();
    // Cells
    for(let r=0;r<SZ;r++) for(let cc=0;cc<SZ;cc++){
      const val=board[r][cc];
      const x=bx+GAP+(cellSize+GAP)*cc;
      const y=by+GAP+(cellSize+GAP)*r;
      const col=TILE_COLORS[val]||'#6c3483';
      ctx.fillStyle=col;
      ctx.beginPath();ctx.roundRect(x,y,cellSize,cellSize,6);ctx.fill();
      if(val){
        const tfs=val>512?~~(cellSize*0.32):val>64?~~(cellSize*0.38):~~(cellSize*0.44);
        ctx.font=`bold ${tfs}px "Press Start 2P"`;
        ctx.fillStyle=TILE_TEXT_COLORS[val]||'#fff';
        ctx.textAlign='center';ctx.textBaseline='middle';
        ctx.fillText(val,x+cellSize/2,y+cellSize/2);
      }
    }
    ctx.textBaseline='alphabetic';ctx.textAlign='left';
    if(won&&!over){
      ctx.fillStyle='rgba(39,174,96,0.3)';ctx.fillRect(0,0,W,H);
      ctx.fillStyle='#2ecc71';ctx.font=`bold ${~~(W*0.06)}px "Press Start 2P"`;
      ctx.textAlign='center';ctx.fillText('YOU WIN!',W/2,H/2);ctx.textAlign='left';
    }
  }
  function loop(){raf=requestAnimationFrame(loop);if(!running)return;draw();}

  const DIRS={'ArrowLeft':'left','ArrowRight':'right','ArrowUp':'up','ArrowDown':'down',
              'a':'left','d':'right','w':'up','s':'down'};
  let tx=0,ty=0;
  const kd=e=>{
    if(over){if(e.key==='Enter')init();return;}
    if(DIRS[e.key]){move(DIRS[e.key]);e.preventDefault();}
  };
  // Touch swipe
  const td=e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY;};
  const tu=e=>{
    if(over){init();return;}
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)>Math.abs(dy)) move(dx>0?'right':'left');
    else move(dy>0?'down':'up');
  };
  document.addEventListener('keydown',kd);
  canvas.addEventListener('touchstart',td,{passive:true});
  canvas.addEventListener('touchend',tu,{passive:true});
  color='#f0c040'; running=true; init(); raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);},setColor(c2){color=c2;}};
}

/* ══════════════════════════════════════════
   GAME: TETRIS — classic block stacking
══════════════════════════════════════════ */
function gameTetris(canvas,W){
  const COLS=10, ROWS=20;
  const H=~~(W*(ROWS/COLS)*0.9); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const BS=~~(H/ROWS); // block size
  const OX=~~((W-COLS*BS)/2); // offset x for centered board
  let board,piece,next,score,lines,level,dropTimer,raf,running,over,color,keys={};

  const SHAPES={
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    O:[[1,1],[1,1]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]],
    L:[[1,0,0],[1,1,1],[0,0,0]],
    J:[[0,0,1],[1,1,1],[0,0,0]],
  };
  const COLORS={I:'#00f0f0',O:'#f0f000',T:'#a000f0',S:'#00f000',Z:'#f00000',L:'#f0a000',J:'#0000f0'};
  const KEYS=Object.keys(SHAPES);

  function emptyBoard(){return Array.from({length:ROWS},()=>Array(COLS).fill(0));}
  function randPiece(){
    const k=KEYS[~~(Math.random()*KEYS.length)];
    return{shape:SHAPES[k].map(r=>[...r]),color:COLORS[k],x:~~(COLS/2)-~~(SHAPES[k][0].length/2),y:0};
  }
  function rotate(shape){return shape[0].map((_,i)=>shape.map(r=>r[r.length-1-i]));}
  function fits(sh,x,y){
    for(let r=0;r<sh.length;r++) for(let c=0;c<sh[r].length;c++){
      if(!sh[r][c])continue;
      if(x+c<0||x+c>=COLS||y+r>=ROWS)return false;
      if(y+r>=0&&board[y+r][x+c])return false;
    }
    return true;
  }
  function lock(){
    piece.shape.forEach((row,r)=>row.forEach((v,c)=>{
      if(v&&piece.y+r>=0)board[piece.y+r][piece.x+c]=piece.color;
    }));
    // Clear lines
    let cleared=0;
    for(let r=ROWS-1;r>=0;){
      if(board[r].every(v=>v)){board.splice(r,1);board.unshift(Array(COLS).fill(0));cleared++;} else r--;
    }
    if(cleared){const pts=[0,100,300,500,800];score+=pts[cleared]*(level+1);lines+=cleared;level=~~(lines/10);setScore(score);}
    piece=next;next=randPiece();
    if(!fits(piece.shape,piece.x,piece.y)){over=true;showGover();}
  }
  function init(){board=emptyBoard();piece=randPiece();next=randPiece();score=0;lines=0;level=0;over=false;dropTimer=0;setScore(0);hideGover();}
  function drop(){if(fits(piece.shape,piece.x,piece.y+1))piece.y++;else lock();}
  function hardDrop(){while(fits(piece.shape,piece.x,piece.y+1))piece.y++;lock();}
  function ghostY(){let gy=piece.y;while(fits(piece.shape,piece.x,gy+1))gy++;return gy;}

  function drawBlock(x,y,col,alpha=1){
    ctx.globalAlpha=alpha;
    ctx.fillStyle=col;
    ctx.fillRect(OX+x*BS+1,y*BS+1,BS-2,BS-2);
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillRect(OX+x*BS+1,y*BS+1,BS-2,3);
    ctx.fillStyle='rgba(0,0,0,0.25)';
    ctx.fillRect(OX+x*BS+1,y*BS+BS-4,BS-2,3);
    ctx.globalAlpha=1;
  }
  function draw(){
    ctx.fillStyle='#0d0b1a';ctx.fillRect(0,0,W,H);
    // Board border
    ctx.strokeStyle=color||'#3df5c1';ctx.lineWidth=2;
    ctx.strokeRect(OX-1,0,COLS*BS+2,ROWS*BS);
    // Board cells
    for(let r=0;r<ROWS;r++) for(let c=0;c<COLS;c++){
      if(board[r][c])drawBlock(c,r,board[r][c]);
      else{ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fillRect(OX+c*BS,r*BS,BS,BS);}
    }
    // Ghost
    const gy=ghostY();
    piece.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawBlock(piece.x+c,gy+r,piece.color,0.2);}));
    // Piece
    piece.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v&&piece.y+r>=0)drawBlock(piece.x+c,piece.y+r,piece.color);}));
    // Side panel
    const px=OX+COLS*BS+10;
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.font=`${~~(BS*0.55)}px "Press Start 2P"`;
    ctx.fillText('NEXT',px,BS*2);
    next.shape.forEach((row,r)=>row.forEach((v,c)=>{if(v)drawBlock(next.x+c-~~(COLS/2)+1,r+3,next.color);}));
    ctx.fillText(`LVL\n${level}`,px,BS*9);
    ctx.fillText(`${lines}\nLNS`,px,BS*12);
  }

  let lastT=0,repeatKey=null,repeatTimer=0;
  function loop(ts){
    raf=requestAnimationFrame(loop);if(!running||over)return;
    const dt=Math.min(ts-lastT,50);lastT=ts;
    const speed=Math.max(100,800-level*70);
    dropTimer+=dt;if(dropTimer>speed){drop();dropTimer=0;}
    // Key repeat
    if(repeatKey){repeatTimer+=dt;if(repeatTimer>90){handleKey(repeatKey);repeatTimer=0;}}
    draw();
  }
  function handleKey(k){
    if(k==='ArrowLeft'&&fits(piece.shape,piece.x-1,piece.y))piece.x--;
    if(k==='ArrowRight'&&fits(piece.shape,piece.x+1,piece.y))piece.x++;
    if(k==='ArrowDown')drop();
  }
  const kd=e=>{
    if(over){if(e.key==='Enter')init();return;}
    if(['ArrowLeft','ArrowRight','ArrowDown'].includes(e.key)){handleKey(e.key);repeatKey=e.key;repeatTimer=0;e.preventDefault();}
    if(e.key==='ArrowUp'||e.key==='x'){const r=rotate(piece.shape);if(fits(r,piece.x,piece.y))piece.shape=r;e.preventDefault();}
    if(e.key===' '){hardDrop();e.preventDefault();}
  };
  const ku=e=>{if(e.key===repeatKey)repeatKey=null;};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  color='#3df5c1';running=true;init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);},setColor(c2){color=c2;}};
}

/* ══════════════════════════════════════════
   GAME: PONG — classic paddle game vs AI
══════════════════════════════════════════ */
function gamePong(canvas,W){
  const H=~~(W*0.6); canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  const PW=~~(W*0.018), PH=~~(H*0.22), BR=~~(W*0.015);
  let p1y,p2y,bx,by,bvx,bvy,s1,s2,raf,running,color,keys={};

  function init(){
    p1y=H/2-PH/2; p2y=H/2-PH/2;
    bx=W/2; by=H/2;
    const ang=(Math.random()-0.5)*1.2;
    const spd=W*0.006;
    bvx=spd*(Math.random()>0.5?1:-1); bvy=spd*Math.sin(ang);
    s1=0; s2=0; setScore(0); hideGover();
  }
  function clamp(v,lo,hi){return Math.max(lo,Math.min(hi,v));}

  function update(dt){
    // AI (right paddle)
    const aiSpeed=H*0.004*dt;
    p2y+=(by-(p2y+PH/2))*0.055;
    p2y=clamp(p2y,0,H-PH);
    // Player (left paddle)
    const spd=H*0.012*dt;
    if(keys['ArrowUp']||keys['w'])   p1y=clamp(p1y-spd,0,H-PH);
    if(keys['ArrowDown']||keys['s']) p1y=clamp(p1y+spd,0,H-PH);
    // Ball
    bx+=bvx*dt; by+=bvy*dt;
    // Top/bottom bounce
    if(by-BR<0){by=BR;bvy=Math.abs(bvy);}
    if(by+BR>H){by=H-BR;bvy=-Math.abs(bvy);}
    // Paddle collisions
    const px1=~~(W*0.04), px2=W-~~(W*0.04)-PW;
    if(bvx<0&&bx-BR<px1+PW&&bx+BR>px1&&by>p1y&&by<p1y+PH){
      bvx=Math.abs(bvx)*1.04; bvy+=(by-(p1y+PH/2))*0.06; bx=px1+PW+BR;
      bvx=Math.min(bvx,W*0.015);
    }
    if(bvx>0&&bx+BR>px2&&bx-BR<px2+PW&&by>p2y&&by<p2y+PH){
      bvx=-Math.abs(bvx)*1.04; bvy+=(by-(p2y+PH/2))*0.06; bx=px2-BR;
      bvx=Math.max(bvx,-W*0.015);
    }
    // Score
    if(bx<0){s2++;setScore(s1*10);bx=W/2;by=H/2;bvx=W*0.006;bvy=(Math.random()-0.5)*W*0.004;}
    if(bx>W){s1++;setScore(s1*10);bx=W/2;by=H/2;bvx=-W*0.006;bvy=(Math.random()-0.5)*W*0.004;}
  }

  function draw(){
    ctx.fillStyle='#0d0b1a';ctx.fillRect(0,0,W,H);
    // Center line
    ctx.setLineDash([~~(H*0.04),~~(H*0.03)]);
    ctx.strokeStyle='rgba(255,255,255,0.15)';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(W/2,0);ctx.lineTo(W/2,H);ctx.stroke();
    ctx.setLineDash([]);
    // Scores
    const fs=~~(H*0.1);
    ctx.font=`bold ${fs}px "Press Start 2P"`;ctx.textAlign='center';
    ctx.fillStyle='rgba(255,255,255,0.2)';
    ctx.fillText(s1,W/2-W*0.15,fs*1.1);
    ctx.fillText(s2,W/2+W*0.15,fs*1.1);
    ctx.textAlign='left';
    // Paddles
    const px1=~~(W*0.04), px2=W-~~(W*0.04)-PW;
    const col=color||'#fff';
    ctx.fillStyle=col;
    ctx.beginPath();ctx.roundRect(px1,p1y,PW,PH,4);ctx.fill();
    ctx.fillStyle='rgba(255,255,255,0.7)';
    ctx.beginPath();ctx.roundRect(px2,p2y,PW,PH,4);ctx.fill();
    // Ball with glow
    ctx.shadowBlur=18;ctx.shadowColor=col;
    ctx.fillStyle=col;ctx.beginPath();ctx.arc(bx,by,BR,0,Math.PI*2);ctx.fill();
    ctx.shadowBlur=0;
    // Labels
    ctx.fillStyle='rgba(255,255,255,0.3)';ctx.font=`${~~(H*0.03)}px Rajdhani`;
    ctx.textAlign='center';
    ctx.fillText('YOU',px1+PW/2,H-6);
    ctx.fillText('AI',px2+PW/2,H-6);
    ctx.textAlign='left';
  }

  let lastT=0;
  function loop(ts){
    raf=requestAnimationFrame(loop);if(!running)return;
    const dt=Math.min((ts-lastT)/16.67,3);lastT=ts;
    update(dt);draw();
  }
  const kd=e=>{keys[e.key]=true;e.preventDefault&&['ArrowUp','ArrowDown',' '].includes(e.key)&&e.preventDefault();};
  const ku=e=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  color='#44aaff';running=true;init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);},setColor(c2){color=c2;}};
}

/* ══════════════════════════════════════════
   GAME: PACMAN — classic dot-eating maze
══════════════════════════════════════════ */
function gamePacman(canvas,W){
  const MAZE_W=19, MAZE_H=21;
  const CS=~~(W/MAZE_W);
  const H=CS*MAZE_H+~~(W*0.08);
  canvas.width=W; canvas.height=H;
  const ctx=canvas.getContext('2d');
  let px,py,pdx,pdy,pmouth,score,lives,ghosts,dots,energizers,scared,raf,running,color,keys={};

  // 0=empty 1=wall 2=dot 3=energizer
  const LAYOUT=[
    '1111111111111111111',
    '1222222222222222221',
    '1211121112311112121',
    '1211121112311112121',
    '1222222222222222221',
    '1211211111111121121',
    '1222212222222212221',
    '1111213111131211111',
    '0000212100121210000',
    '1111212111121211111',
    '0000222000022200000',
    '1111212111121211111',
    '0000212100121210000',
    '1111213111131211111',
    '1222222222222222221',
    '1211121112311112121',
    '1232212222222212321',
    '1122212111111211221',
    '1211222222222221121',
    '1211111111111111121',
    '1111111111111111111',
  ].map(r=>r.split('').map(Number));

  function initMap(){
    dots=[];energizers=[];
    LAYOUT.forEach((row,ry)=>row.forEach((cell,cx)=>{
      if(cell===2)dots.push({x:cx,y:ry,alive:true});
      if(cell===3)energizers.push({x:cx,y:ry,alive:true});
    }));
  }
  function isWall(x,y){
    if(x<0||x>=MAZE_W||y<0||y>=MAZE_H)return true;
    return LAYOUT[y][x]===1;
  }
  function initGhosts(){
    return[
      {x:9,y:9,dx:1,dy:0,col:'#ff0000',home:{x:9,y:9}},
      {x:9,y:10,dx:-1,dy:0,col:'#ffb8ff',home:{x:9,y:10}},
      {x:8,y:9,dx:0,dy:-1,col:'#00ffff',home:{x:8,y:9}},
      {x:10,y:9,dx:0,dy:1,col:'#ffb852',home:{x:10,y:9}},
    ];
  }
  function init(){
    px=9;py=15;pdx=1;pdy=0;pmouth=0;score=0;lives=3;scared=0;
    ghosts=initGhosts();initMap();setScore(0);hideGover();
  }

  let moveTimer=0, ghostTimer=0;
  function update(dt){
    pmouth+=dt*0.12;
    if(scared>0)scared-=dt;
    moveTimer+=dt;
    if(moveTimer>8){
      moveTimer=0;
      const nx=px+pdx, ny=py+pdy;
      if(!isWall((nx+MAZE_W)%MAZE_W,ny)){px=(nx+MAZE_W)%MAZE_W;py=ny;}
      // Eat dots
      const d=dots.find(d=>d.alive&&d.x===px&&d.y===py);
      if(d){d.alive=false;score+=10;setScore(score);}
      const e=energizers.find(e=>e.alive&&e.x===px&&e.y===py);
      if(e){e.alive=false;score+=50;setScore(score);scared=300;}
      // Ghost collision
      ghosts.forEach(g=>{
        if(Math.abs(g.x-px)<1&&Math.abs(g.y-py)<1){
          if(scared>0){g.x=g.home.x;g.y=g.home.y;score+=200;setScore(score);}
          else{lives--;if(lives<=0){showGover();}px=9;py=15;}
        }
      });
      // Win
      if(dots.every(d=>!d.alive)&&energizers.every(e=>!e.alive)){score+=500;setScore(score);initMap();}
    }
    ghostTimer+=dt;
    if(ghostTimer>14){
      ghostTimer=0;
      ghosts.forEach(g=>{
        const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
        const valid=dirs.filter(([dx,dy])=>!isWall((g.x+dx+MAZE_W)%MAZE_W,g.y+dy)&&!(dx===-g.dx&&dy===-g.dy));
        if(!valid.length)return;
        const [dx,dy]=valid[~~(Math.random()*valid.length)];
        g.x=(g.x+dx+MAZE_W)%MAZE_W;g.y+=dy;g.dx=dx;g.dy=dy;
      });
    }
  }

  function draw(){
    ctx.fillStyle='#000';ctx.fillRect(0,0,W,H);
    // Maze
    LAYOUT.forEach((row,ry)=>row.forEach((cell,cx)=>{
      const sx=cx*CS, sy=ry*CS+~~(W*0.05);
      if(cell===1){
        ctx.fillStyle='#1a1a8a';ctx.fillRect(sx,sy,CS,CS);
        ctx.strokeStyle='#3333cc';ctx.lineWidth=1;ctx.strokeRect(sx+1,sy+1,CS-2,CS-2);
      }
    }));
    // Dots
    dots.forEach(d=>{
      if(!d.alive)return;
      ctx.fillStyle='#ffeeaa';ctx.beginPath();
      ctx.arc(d.x*CS+CS/2,d.y*CS+CS/2+~~(W*0.05),CS*0.1,0,Math.PI*2);ctx.fill();
    });
    // Energizers
    energizers.forEach(e=>{
      if(!e.alive)return;
      ctx.fillStyle='#ffeeaa';ctx.shadowBlur=8;ctx.shadowColor='#ffeeaa';
      ctx.beginPath();ctx.arc(e.x*CS+CS/2,e.y*CS+CS/2+~~(W*0.05),CS*0.22,0,Math.PI*2);ctx.fill();
      ctx.shadowBlur=0;
    });
    // Ghosts
    ghosts.forEach(g=>{
      const gx=g.x*CS+CS/2, gy=g.y*CS+CS/2+~~(W*0.05), gr=CS*0.4;
      ctx.fillStyle=scared>0?'#2222ff':g.col;
      ctx.beginPath();ctx.arc(gx,gy-gr*0.2,gr,Math.PI,0);
      ctx.lineTo(gx+gr,gy+gr*0.8);
      for(let i=3;i>=0;i--){ctx.lineTo(gx+gr-(i+0.5)*(gr*2/3),gy+gr*(i%2?0.4:0.8));}
      ctx.lineTo(gx-gr,gy+gr*0.8);ctx.closePath();ctx.fill();
      // Eyes
      ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(gx-gr*.28,gy-gr*.2,gr*.22,0,Math.PI*2);ctx.fill();
      ctx.beginPath();ctx.arc(gx+gr*.28,gy-gr*.2,gr*.22,0,Math.PI*2);ctx.fill();
    });
    // Pac-Man
    const pcx=px*CS+CS/2, pcy=py*CS+CS/2+~~(W*0.05);
    const mouth=Math.abs(Math.sin(pmouth))*0.7;
    const ang=pdx===1?0:pdx===-1?Math.PI:pdy===-1?-Math.PI/2:Math.PI/2;
    ctx.fillStyle=color||'#f0c040';ctx.shadowBlur=12;ctx.shadowColor=color||'#f0c040';
    ctx.beginPath();ctx.moveTo(pcx,pcy);
    ctx.arc(pcx,pcy,CS*0.42,ang+mouth,ang+Math.PI*2-mouth);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;
    // HUD
    const fs=~~(W*0.028);
    ctx.font=`bold ${fs}px "Press Start 2P"`;ctx.fillStyle=color||'#f0c040';
    ctx.textAlign='left';ctx.fillText(`LIVES: ${'♥'.repeat(Math.max(0,lives))}`,8,fs*1.1);
  }

  const DIR_MAP={'ArrowLeft':[-1,0],'ArrowRight':[1,0],'ArrowUp':[0,-1],'ArrowDown':[0,1],
                 'a':[-1,0],'d':[1,0],'w':[0,-1],'s':[0,1]};
  let lastT=0;
  function loop(ts){
    raf=requestAnimationFrame(loop);if(!running)return;
    const dt=Math.min((ts-lastT),50);lastT=ts;
    update(dt);draw();
  }
  const kd=e=>{
    if(DIR_MAP[e.key]){[pdx,pdy]=DIR_MAP[e.key];}
    if(e.key==='Enter')init();
    ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown',' '].includes(e.key)&&e.preventDefault();
  };
  document.addEventListener('keydown',kd);
  color='#f0c040';running=true;init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);},setColor(c2){color=c2;}};
}


function hexRgb(hex){
  const r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  return`${r},${g},${b}`;
}

/* ══════════════════════════════════════════
   GAME: SPACE INVADERS
══════════════════════════════════════════ */
function gameInvaders(canvas,W){
  const H=~~(W*1.15);canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let player,bullets,aliens,abombs,particles,score,lives,raf,running,keys,color;
  let wave=1,alienDir=1,alienDropTimer=0,alienShootTimer=0,shieldHP;
  const SHIELDS=3;

  function mkShields(){
    shieldHP=[];
    for(let i=0;i<SHIELDS;i++){
      const bx=W*(0.18+i*0.32)-30;
      const by=H*0.72;
      const block=[];
      for(let r=0;r<4;r++)for(let c=0;c<8;c++)block.push({x:bx+c*8,y:by+r*8,alive:true});
      shieldHP.push(block);
    }
  }
  function mkAliens(){
    aliens=[];
    const rows=3+Math.min(wave-1,2),cols=8+Math.min(wave-1,3);
    const sw=Math.min(W*0.85,(cols)*(W<400?30:38));
    const cx=(W-sw)/2;
    for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
      const types=['👾','👽','🛸'];
      aliens.push({x:cx+c*(sw/cols),y:48+r*32,w:22,h:18,alive:true,type:types[r%3],pts:(rows-r)*10});
    }
  }
  function spawnParts(x,y,col,n=8){
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:col});}
  }
  function init(){
    player={x:W/2,y:H-46,w:36,h:12};
    bullets=[];abombs=[];particles=[];
    score=0;lives=3;running=true;wave=1;alienDir=1;alienDropTimer=0;alienShootTimer=0;
    setScore(0);hideGover();mkAliens();mkShields();
    color=playerColors['invaders']||'#3df5c1';
  }

  function loop(ts){
    raf=requestAnimationFrame(loop);
    if(!running)return;
    ctx.fillStyle='#04020a';ctx.fillRect(0,0,W,H);
    // stars bg
    for(let i=0;i<3;i++){
      const sx=(Math.sin(ts*0.0003+i*333)*.5+.5)*W;
      const sy=(ts*0.02+i*333)%H;
      ctx.fillStyle='rgba(255,255,255,0.3)';ctx.fillRect(sx,sy,1,1);
    }

    // move aliens
    alienDropTimer++;
    const speed=0.8+wave*0.3+Math.min((100-aliens.filter(a=>a.alive).length)*0.04,1.5);
    aliens.forEach(a=>{if(!a.alive)return;a.x+=alienDir*speed;});
    const aliveA=aliens.filter(a=>a.alive);
    const maxX=Math.max(...aliveA.map(a=>a.x+a.w)),minX=Math.min(...aliveA.map(a=>a.x));
    if(maxX>W-4||minX<4){alienDir*=-1;aliens.forEach(a=>{if(a.alive)a.y+=12;});}

    // alien shoot
    alienShootTimer++;
    const shootInterval=Math.max(35-wave*3,12);
    if(alienShootTimer>shootInterval&&aliveA.length){
      alienShootTimer=0;
      const shooter=aliveA[~~(Math.random()*aliveA.length)];
      abombs.push({x:shooter.x+11,y:shooter.y+18,vy:3+wave*0.5});
    }

    // player move
    if(keys['ArrowLeft']||keys['a'])player.x=Math.max(0,player.x-5);
    if(keys['ArrowRight']||keys['d'])player.x=Math.min(W-player.w,player.x+5);

    // move bullets
    bullets=bullets.filter(b=>{b.y-=9;return b.y>-10;});
    abombs=abombs.filter(b=>{b.y+=b.vy;return b.y<H+10;});

    // particles
    particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.08;p.life-=0.035;return p.life>0;});
    particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);});
    ctx.globalAlpha=1;

    // bullet vs aliens
    bullets.forEach(b=>{
      aliens.forEach(a=>{
        if(!a.alive)return;
        if(b.x>a.x&&b.x<a.x+a.w&&b.y>a.y&&b.y<a.y+a.h){
          a.alive=false;b.y=-999;score+=a.pts;setScore(score);spawnParts(a.x+11,a.y+9,color);
        }
      });
    });

    // alien bombs vs shields
    shieldHP.forEach(shield=>{
      abombs.forEach(b=>{
        shield.forEach(bl=>{
          if(!bl.alive)return;
          if(b.x>bl.x&&b.x<bl.x+8&&b.y>bl.y&&b.y<bl.y+8){bl.alive=false;b.y=-999;}
        });
      });
      // bullet vs shields
      bullets.forEach(bul=>{
        shield.forEach(bl=>{
          if(!bl.alive)return;
          if(bul.x>bl.x&&bul.x<bl.x+8&&bul.y>bl.y&&bul.y<bl.y+8){bl.alive=false;bul.y=-999;}
        });
      });
    });

    // alien bombs vs player
    abombs.forEach(b=>{
      if(b.x>player.x&&b.x<player.x+player.w&&b.y>player.y&&b.y<player.y+player.h){
        spawnParts(player.x+18,player.y,color,16);lives--;b.y=-999;
        if(lives<=0){running=false;showGover('GAME OVER','Score: '+score,()=>init());}
      }
    });

    // aliens reach bottom
    if(aliveA.some(a=>a.y+a.h>player.y)){
      running=false;showGover('INVADED!','Score: '+score,()=>init());return;
    }

    // all aliens dead → next wave
    if(!aliveA.length){wave++;score+=wave*100;setScore(score);mkAliens();mkShields();}

    // draw shields
    shieldHP.forEach(shield=>{
      shield.forEach(bl=>{if(!bl.alive)return;ctx.fillStyle='rgba(61,245,193,0.7)';ctx.fillRect(bl.x,bl.y,7,7);});
    });

    // draw aliens
    ctx.font='18px serif';ctx.textAlign='center';
    aliens.forEach(a=>{
      if(!a.alive)return;
      ctx.shadowBlur=8;ctx.shadowColor=color;
      ctx.fillText(a.type,a.x+11,a.y+16);
    });
    ctx.shadowBlur=0;

    // draw bombs
    abombs.forEach(b=>{ctx.fillStyle='#ff4f7b';ctx.fillRect(b.x-2,b.y-8,4,10);});

    // draw player bullets
    bullets.forEach(b=>{
      ctx.fillStyle=color;ctx.shadowBlur=10;ctx.shadowColor=color;
      ctx.fillRect(b.x-2,b.y-10,4,12);ctx.shadowBlur=0;
    });

    // draw player ship
    ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h/2);
    ctx.fillStyle=color;ctx.shadowBlur=18;ctx.shadowColor=color;
    ctx.beginPath();ctx.moveTo(0,-player.h);ctx.lineTo(player.w/2,player.h/2);ctx.lineTo(-player.w/2,player.h/2);ctx.closePath();ctx.fill();
    ctx.shadowBlur=0;ctx.restore();

    // HUD
    const fs=~~(W*0.026);
    ctx.fillStyle=color;ctx.font=`bold ${fs}px "Press Start 2P"`;ctx.textAlign='left';
    ctx.fillText('LIVES: '+'♥ '.repeat(Math.max(0,lives)).trim(),8,H-8);
    ctx.textAlign='right';ctx.fillStyle='rgba(255,255,255,0.5)';
    ctx.fillText('WAVE '+wave,W-8,H-8);ctx.textAlign='left';
  }

  keys={};
  const kd=e=>{
    keys[e.key]=true;
    if((e.key===' '||e.key==='Space')&&running){
      e.preventDefault();
      if(bullets.length<4)bullets.push({x:player.x+player.w/2,y:player.y});
    }
    if(e.key==='Enter')init();
  };
  const ku=e=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: MINESWEEPER
══════════════════════════════════════════ */
function gameMinesweeper(canvas,W){
  const COLS=10,ROWS=10,MINES=12;
  const CS=Math.floor((W-4)/COLS);
  const GW=CS*COLS,GH=CS*ROWS;
  const H=GH+64;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let board,revealed,flagged,gameState,score,startTime,color;
  const NCOLS=['','#44aaff','#3df5c1','#ff4f7b','#7b5cff','#ff8c42','#00f0f0','#f0c040','#ffffff'];

  function init(){
    board=Array.from({length:ROWS},()=>Array(COLS).fill(0));
    revealed=Array.from({length:ROWS},()=>Array(COLS).fill(false));
    flagged=Array.from({length:ROWS},()=>Array(COLS).fill(false));
    // place mines
    let placed=0;
    while(placed<MINES){
      const r=~~(Math.random()*ROWS),c=~~(Math.random()*COLS);
      if(board[r][c]!==-1){board[r][c]=-1;placed++;}
    }
    // calc numbers
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      if(board[r][c]===-1)continue;
      let cnt=0;
      for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){
        const nr=r+dr,nc=c+dc;
        if(nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&board[nr][nc]===-1)cnt++;
      }
      board[r][c]=cnt;
    }
    gameState='play';score=0;startTime=Date.now();setScore(0);hideGover();
    color=playerColors['minesweeper']||'#ff4f7b';
    draw();
  }

  function reveal(r,c){
    if(r<0||r>=ROWS||c<0||c>=COLS||revealed[r][c]||flagged[r][c])return;
    revealed[r][c]=true;
    if(board[r][c]===-1){
      gameState='dead';
      // reveal all mines
      for(let rr=0;rr<ROWS;rr++)for(let cc=0;cc<COLS;cc++)if(board[rr][cc]===-1)revealed[rr][cc]=true;
      draw();showGover('💥 BOOM!','Score: '+score,()=>init());return;
    }
    if(board[r][c]===0){
      for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++)reveal(r+dr,c+dc);
    }
    score+=10;setScore(score);
    // check win
    let unrevealed=0;
    for(let rr=0;rr<ROWS;rr++)for(let cc=0;cc<COLS;cc++)if(!revealed[rr][cc]&&board[rr][cc]!==-1)unrevealed++;
    if(!unrevealed){
      const secs=~~((Date.now()-startTime)/1000);
      score+=Math.max(0,500-secs*5);setScore(score);
      gameState='win';showGover('YOU WIN! 🎉','Score: '+score,()=>init());
    }
  }

  function draw(){
    const ox=(W-GW)/2;
    ctx.fillStyle='#06040e';ctx.fillRect(0,0,W,H);
    // header
    let flags=0;for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++)if(flagged[r][c])flags++;
    ctx.fillStyle='rgba(255,255,255,0.08)';ctx.fillRect(0,0,W,46);
    ctx.font=`bold ${~~(W*0.032)}px "Press Start 2P"`;
    ctx.fillStyle=color;ctx.textAlign='left';ctx.fillText('💣 '+(MINES-flags),ox,30);
    ctx.fillStyle='rgba(255,255,255,0.5)';ctx.textAlign='right';
    const secs=~~((Date.now()-startTime)/1000);
    ctx.fillText('⏱ '+secs+'s',W-ox,30);ctx.textAlign='left';
    // grid
    for(let r=0;r<ROWS;r++)for(let c=0;c<COLS;c++){
      const x=ox+c*CS,y=48+r*CS;
      if(revealed[r][c]){
        ctx.fillStyle=board[r][c]===-1?'rgba(255,79,123,0.3)':'rgba(255,255,255,0.05)';
        ctx.fillRect(x+1,y+1,CS-2,CS-2);
        if(board[r][c]===-1){
          ctx.font=`${CS*0.6}px serif`;ctx.textAlign='center';ctx.fillText('💣',x+CS/2,y+CS*0.72);
        } else if(board[r][c]>0){
          ctx.fillStyle=NCOLS[board[r][c]];ctx.font=`bold ${~~(CS*0.52)}px "Press Start 2P"`;
          ctx.textAlign='center';ctx.fillText(board[r][c],x+CS/2,y+CS*0.68);
        }
      } else {
        const isFlag=flagged[r][c];
        ctx.fillStyle=isFlag?'rgba(240,192,64,0.18)':'rgba(255,255,255,0.07)';
        ctx.fillRect(x+1,y+1,CS-2,CS-2);
        ctx.strokeStyle=isFlag?'rgba(240,192,64,0.5)':'rgba(255,255,255,0.12)';
        ctx.lineWidth=1;ctx.strokeRect(x+1,y+1,CS-2,CS-2);
        if(isFlag){ctx.font=`${CS*0.55}px serif`;ctx.textAlign='center';ctx.fillText('🚩',x+CS/2,y+CS*0.72);}
      }
    }
    ctx.textAlign='left';
  }

  // click handler
  const onClick=e=>{
    if(gameState!=='play')return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleY;
    const ox=(W-GW)/2;
    const c=~~((mx-ox)/CS),r=~~((my-48)/CS);
    if(c<0||c>=COLS||r<0||r>=ROWS)return;
    if(e.button===2||e.ctrlKey){
      if(!revealed[r][c]){flagged[r][c]=!flagged[r][c];}
    } else {
      if(!flagged[r][c])reveal(r,c);
    }
    draw();
  };
  const onCtx=e=>e.preventDefault();
  const kd=e=>{if(e.key==='Enter')init();};
  canvas.addEventListener('click',onClick);canvas.addEventListener('contextmenu',onCtx);
  document.addEventListener('keydown',kd);
  let timerRaf;
  function timerLoop(){timerRaf=requestAnimationFrame(timerLoop);if(gameState==='play')draw();}
  timerLoop();
  init();
  return{stop(){cancelAnimationFrame(timerRaf);canvas.removeEventListener('click',onClick);canvas.removeEventListener('contextmenu',onCtx);document.removeEventListener('keydown',kd);},setColor(c){color=c;draw();}};
}

/* ══════════════════════════════════════════
   GAME: PIXEL RUNNER
══════════════════════════════════════════ */
function gameRunner(canvas,W){
  const H=~~(W*0.55);canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let player,obstacles,particles,score,speed,raf,running,groundY,color,frame,distance;
  const GH=18,PH=32,PW=18;

  function init(){
    groundY=H-GH;
    player={x:60,y:groundY-PH,w:PW,h:PH,vy:0,onGround:true,ducking:false};
    obstacles=[];particles=[];score=0;speed=4;distance=0;running=true;frame=0;
    setScore(0);hideGover();color=playerColors['runner']||'#ff8c42';
  }

  function spawnParts(x,y,col,n=8){
    for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=1+Math.random()*3;particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:1,color:col});}
  }

  const JUMP_V=-13;
  function jump(){if(player.onGround){player.vy=JUMP_V;player.onGround=false;}}

  function loop(){
    raf=requestAnimationFrame(loop);
    if(!running)return;
    frame++;
    ctx.fillStyle='#04020a';ctx.fillRect(0,0,W,H);

    // scrolling ground grid
    const goff=(frame*speed)%50;
    ctx.strokeStyle='rgba(255,140,66,0.12)';ctx.lineWidth=1;
    for(let x=-goff;x<W;x+=50){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=50){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // ground
    ctx.fillStyle='rgba(255,140,66,0.25)';ctx.fillRect(0,groundY,W,GH);
    ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,groundY);ctx.lineTo(W,groundY);ctx.stroke();

    speed=4+distance*0.002;
    distance+=speed*0.1;
    score=~~distance;setScore(score);

    // spawn obstacles
    if(frame%~~Math.max(40,80-speed*4)===0){
      const tall=Math.random()<0.4&&speed>6;
      const w=20+~~(Math.random()*20);
      const h=tall?PH*1.6:PH*0.7;
      obstacles.push({x:W+20,y:groundY-h,w,h,type:tall?'cactus':'rock'});
    }
    // spawn flying obstacle at higher speeds
    if(speed>7&&frame%120===0){
      obstacles.push({x:W+20,y:groundY-PH*1.8,w:30,h:22,type:'bird'});
    }

    // update obstacles
    obstacles=obstacles.filter(o=>{o.x-=speed;return o.x>-60;});

    // player physics
    if(keys['ArrowDown']||keys['s']){player.ducking=true;player.h=PH*0.5;}
    else{player.ducking=false;player.h=PH;}
    player.vy+=0.8;player.y+=player.vy;
    if(player.y>=groundY-player.h){player.y=groundY-player.h;player.vy=0;player.onGround=true;}

    // collision
    obstacles.forEach(o=>{
      if(player.x+2<o.x+o.w&&player.x+player.w-2>o.x&&player.y+2<o.y+o.h&&player.y+player.h-2>o.y){
        spawnParts(player.x+PW/2,player.y+PH/2,color,16);
        running=false;showGover('GAME OVER','Distance: '+score+'m',()=>init());
      }
    });

    // particles
    particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=0.1;p.life-=0.04;return p.life>0;});
    particles.forEach(p=>{ctx.globalAlpha=p.life;ctx.fillStyle=p.color;ctx.fillRect(p.x-2,p.y-2,4,4);});
    ctx.globalAlpha=1;

    // draw obstacles
    obstacles.forEach(o=>{
      if(o.type==='bird'){
        ctx.font=`${~~(o.h*1.1)}px serif`;ctx.textAlign='center';ctx.fillText('🦅',o.x+o.w/2,o.y+o.h);
      } else {
        ctx.fillStyle=o.type==='cactus'?'#3df5c1':'#7b5cff';
        ctx.shadowBlur=10;ctx.shadowColor=ctx.fillStyle;
        ctx.fillRect(o.x,o.y,o.w,o.h);ctx.shadowBlur=0;
      }
    });

    // draw player
    ctx.fillStyle=color;ctx.shadowBlur=14;ctx.shadowColor=color;
    const ph=player.ducking?player.h:player.h;
    // body
    ctx.fillRect(player.x,player.y,player.w,ph);
    // head blink
    if(!player.ducking){
      ctx.fillStyle='#fff';ctx.fillRect(player.x+4,player.y-10,player.w-4,10);
      ctx.fillStyle='#06040e';ctx.fillRect(player.x+10,player.y-8,4,4); // eye
    }
    ctx.shadowBlur=0;

    // HUD
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.font=`${~~(W*0.025)}px "Press Start 2P"`;
    ctx.textAlign='right';ctx.fillText(score+'m',W-10,22);ctx.textAlign='left';
  }

  const keys={};
  const kd=e=>{
    keys[e.key]=true;
    if((e.key===' '||e.key==='ArrowUp'||e.key==='w')&&running){e.preventDefault();jump();}
    if(e.key==='Enter')init();
  };
  const ku=e=>{keys[e.key]=false;};
  document.addEventListener('keydown',kd);document.addEventListener('keyup',ku);
  init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',kd);document.removeEventListener('keyup',ku);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: WHACK-A-MOLE
══════════════════════════════════════════ */
function gameWhack(canvas,W){
  const COLS=3,ROWS=3,HOLES=COLS*ROWS;
  const HOLE_R=~~(W*0.1),PAD=~~(W*0.06);
  const GW=COLS*(HOLE_R*2+PAD)+PAD;
  const GH=ROWS*(HOLE_R*2+PAD)+PAD;
  const H=GH+80;
  canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let moles,score,timeLeft,raf,gameState,color,frame;
  const GAME_TIME=30;
  const OX=(W-GW)/2,OY=64;

  function holePos(i){
    const c=i%COLS,r=~~(i/COLS);
    return{x:OX+PAD+HOLE_R+c*(HOLE_R*2+PAD),y:OY+PAD+HOLE_R+r*(HOLE_R*2+PAD)};
  }

  function init(){
    moles=Array.from({length:HOLES},(_,i)=>({...holePos(i),up:false,timer:0,hit:false,hitTimer:0}));
    score=0;timeLeft=GAME_TIME;frame=0;gameState='play';
    setScore(0);hideGover();color=playerColors['whack']||'#f0c040';
  }

  function loop(ts){
    raf=requestAnimationFrame(loop);
    frame++;
    ctx.fillStyle='#06040e';ctx.fillRect(0,0,W,H);

    // draw grid background
    ctx.fillStyle='rgba(255,255,255,0.03)';ctx.fillRect(OX,OY,GW,GH);
    ctx.strokeStyle='rgba(255,255,255,0.05)';ctx.lineWidth=1;ctx.strokeRect(OX,OY,GW,GH);

    // timer countdown
    if(gameState==='play'&&frame%60===0){
      timeLeft--;
      if(timeLeft<=0){
        gameState='over';
        showGover('TIME UP! ⏰','Score: '+score,()=>init());
      }
    }

    // mole logic
    moles.forEach(m=>{
      if(gameState!=='play')return;
      if(m.hit){m.hitTimer--;if(m.hitTimer<=0){m.hit=false;m.up=false;m.timer=0;}}
      else if(m.up){m.timer--;if(m.timer<=0){m.up=false;m.timer=0;}}
      else if(Math.random()<0.012){m.up=true;m.timer=~~(70+Math.random()*80)-~~(score*0.3);m.timer=Math.max(m.timer,18);}
    });

    // draw holes + moles
    moles.forEach(m=>{
      // hole shadow
      ctx.fillStyle='rgba(0,0,0,0.6)';ctx.beginPath();ctx.ellipse(m.x,m.y+8,HOLE_R,HOLE_R*0.35,0,0,Math.PI*2);ctx.fill();
      // hole
      ctx.fillStyle='#1a0a0a';ctx.beginPath();ctx.arc(m.x,m.y,HOLE_R,0,Math.PI*2);ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,0.1)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(m.x,m.y,HOLE_R,0,Math.PI*2);ctx.stroke();

      if(m.up||m.hit){
        // mole body
        const mc=m.hit?'#ff4f7b':color;
        ctx.fillStyle=mc;ctx.shadowBlur=m.hit?24:12;ctx.shadowColor=mc;
        ctx.beginPath();ctx.arc(m.x,m.y,HOLE_R*0.8,0,Math.PI*2);ctx.fill();
        ctx.shadowBlur=0;
        // mole face
        ctx.fillStyle='#06040e';
        // eyes
        ctx.beginPath();ctx.arc(m.x-HOLE_R*0.25,m.y-HOLE_R*0.1,3,0,Math.PI*2);ctx.fill();
        ctx.beginPath();ctx.arc(m.x+HOLE_R*0.25,m.y-HOLE_R*0.1,3,0,Math.PI*2);ctx.fill();
        // nose
        ctx.fillStyle='#06040e';ctx.beginPath();ctx.arc(m.x,m.y+HOLE_R*0.15,3,0,Math.PI*2);ctx.fill();
        if(m.hit){
          ctx.fillStyle='#fff';ctx.font=`${HOLE_R*0.8}px serif`;ctx.textAlign='center';
          ctx.fillText('😵',m.x,m.y+HOLE_R*0.35);
        }
      }
    });

    // HUD
    const fs=~~(W*0.028);
    ctx.fillStyle=color;ctx.font=`bold ${fs}px "Press Start 2P"`;ctx.textAlign='left';
    ctx.shadowBlur=0;ctx.fillText('SCORE '+score,10,36);
    ctx.fillStyle=timeLeft<=5?'#ff4f7b':'rgba(255,255,255,0.5)';
    ctx.textAlign='right';ctx.fillText('TIME '+timeLeft,W-10,36);
    ctx.textAlign='left';
  }

  const onClick=e=>{
    if(gameState!=='play')return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=canvas.width/rect.width,scaleY=canvas.height/rect.height;
    const mx=(e.clientX-rect.left)*scaleX,my=(e.clientY-rect.top)*scaleY;
    moles.forEach(m=>{
      if(!m.up||m.hit)return;
      const dx=mx-m.x,dy=my-m.y;
      if(dx*dx+dy*dy<(HOLE_R*0.9)*(HOLE_R*0.9)){
        m.hit=true;m.hitTimer=22;score+=10;setScore(score);
      }
    });
  };
  const kd=e=>{if(e.key==='Enter')init();};
  canvas.addEventListener('click',onClick);
  document.addEventListener('keydown',kd);
  init();raf=requestAnimationFrame(loop);
  return{stop(){cancelAnimationFrame(raf);canvas.removeEventListener('click',onClick);document.removeEventListener('keydown',kd);},setColor(c){color=c;}};
}

/* ══════════════════════════════════════════
   GAME: TYPE RACER
══════════════════════════════════════════ */
function gameTyping(canvas,W){
  const H=~~(W*1.1);canvas.width=W;canvas.height=H;
  const ctx=canvas.getContext('2d');
  let words,typed,score,lives,raf,running,color,startTime,wpm,totalChars;
  const WORD_LIST=['ARCADE','PIXEL','NEON','VORTEX','LASER','TURBO','HYPER','BLAST','CYBER','GHOST','POWER','SPEED','ULTRA','FLASH','STORM','DRIFT','PULSE','QUEST','NOVA','OMEGA','PRISM','APEX','GRID','FLUX','BOLT','ZONE','CORE','RISE','SYNC','ECHO'];

  function rndWord(){
    const w=WORD_LIST[~~(Math.random()*WORD_LIST.length)];
    const speed=1.2+score*0.01+Math.random();
    return{text:w,x:~~(Math.random()*(W-100))+10,y:-24,vy:Math.min(speed,3.5),typed:'',color:randCol()};
  }
  function randCol(){const cols=['#3df5c1','#ff4f7b','#f0c040','#7b5cff','#ff8c42','#44aaff'];return cols[~~(Math.random()*cols.length)];}

  function init(){
    words=[];typed='';score=0;lives=3;running=true;startTime=Date.now();wpm=0;totalChars=0;
    setScore(0);hideGover();color=playerColors['typing']||'#44aaff';
    // seed some words
    for(let i=0;i<3;i++){const w=rndWord();w.y=80+i*120;words.push(w);}
  }

  function loop(ts){
    raf=requestAnimationFrame(loop);
    if(!running)return;
    ctx.fillStyle='#04020a';ctx.fillRect(0,0,W,H);
    // grid
    ctx.strokeStyle='rgba(68,170,255,0.05)';ctx.lineWidth=1;
    for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
    for(let y=0;y<H;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke();}

    // spawn words
    if(Math.random()<0.008+score*0.0002&&words.length<6)words.push(rndWord());

    // update words
    words.forEach(w=>w.y+=w.vy);

    // words hit bottom
    const hitBottom=words.filter(w=>w.y>H);
    hitBottom.forEach(()=>{lives--;});
    words=words.filter(w=>w.y<=H);
    if(lives<=0){running=false;showGover('FINGERS TIRED!','WPM: '+wpm+' | Score: '+score,()=>init());}

    // draw words
    words.forEach(w=>{
      const fs=~~(W*0.04);ctx.font=`bold ${fs}px "Press Start 2P"`;
      // typed part (bright)
      const tw=ctx.measureText(w.text).width;
      ctx.fillStyle='rgba(255,255,255,0.12)';ctx.fillRect(w.x-6,w.y-fs-4,tw+12,fs+10);
      ctx.strokeStyle=w.color+'66';ctx.lineWidth=1;ctx.strokeRect(w.x-6,w.y-fs-4,tw+12,fs+10);
      // untyped
      ctx.fillStyle='rgba(255,255,255,0.4)';ctx.fillText(w.text.slice(w.typed.length),w.x+ctx.measureText(w.typed).width,w.y);
      // typed in color
      if(w.typed.length){ctx.fillStyle=w.color;ctx.shadowBlur=8;ctx.shadowColor=w.color;ctx.fillText(w.typed,w.x,w.y);ctx.shadowBlur=0;}
    });

    // input box
    ctx.fillStyle='rgba(68,170,255,0.08)';ctx.fillRect(8,H-52,W-16,40);
    ctx.strokeStyle=color+'88';ctx.lineWidth=2;ctx.strokeRect(8,H-52,W-16,40);
    ctx.fillStyle=color;ctx.font=`bold ${~~(W*0.038)}px "Press Start 2P"`;ctx.textAlign='center';
    ctx.fillText(typed+'|',W/2,H-23);ctx.textAlign='left';

    // HUD
    const fs2=~~(W*0.024);
    ctx.fillStyle=color;ctx.font=`${fs2}px "Press Start 2P"`;
    ctx.fillText('♥'.repeat(Math.max(0,lives)),8,26);
    const elapsed=(Date.now()-startTime)/60000;
    if(totalChars>0&&elapsed>0)wpm=~~(totalChars/5/elapsed);
    ctx.fillStyle='rgba(255,255,255,0.4)';ctx.textAlign='right';
    ctx.fillText('WPM: '+wpm,W-8,26);ctx.textAlign='left';
  }

  const onKey=e=>{
    if(!running)return;
    if(e.key==='Enter'){init();return;}
    if(e.key==='Backspace'){typed=typed.slice(0,-1);e.preventDefault();return;}
    if(e.key.length!==1||e.ctrlKey||e.metaKey)return;
    e.preventDefault();
    const ch=e.key.toUpperCase();
    typed+=ch;
    // check all words
    let matched=false;
    words.forEach(w=>{
      if(w.typed.length<w.text.length&&w.text[w.typed.length]===ch&&!matched){
        // check if typed so far matches
        const nextTyped=w.typed+ch;
        if(w.text.startsWith(nextTyped)){
          w.typed=nextTyped;matched=true;
          if(w.typed===w.text){
            score+=w.text.length*5;setScore(score);
            totalChars+=w.text.length;
            words=words.filter(x=>x!==w);
          }
        }
      }
    });
    if(!matched)typed='';
    else typed='';
  };
  document.addEventListener('keydown',onKey);
  init();raf=requestAnimationFrame(loop);
  return{stop(){running=false;cancelAnimationFrame(raf);document.removeEventListener('keydown',onKey);},setColor(c){color=c;}};
}



/* ── Touch swipe bridge for non-MC games ── */
(function(){
  let tx=0,ty=0,moved=false;
  document.addEventListener('touchstart',e=>{
    if(e.target.closest('#mario-dpad,#mc-dpad,#mc-overlay,button,a,.slot,.mc-slot'))return;
    tx=e.touches[0].clientX; ty=e.touches[0].clientY; moved=false;
    document.dispatchEvent(new KeyboardEvent('keydown',{key:' ',bubbles:true}));
  },{passive:true});
  document.addEventListener('touchmove',e=>{moved=true;},{passive:true});
  document.addEventListener('touchend',e=>{
    if(e.target.closest('#mario-dpad,#mc-dpad,#mc-overlay,button,a,.slot,.mc-slot'))return;
    document.dispatchEvent(new KeyboardEvent('keyup',{key:' ',bubbles:true}));
    if(!moved)return;
    const dx=e.changedTouches[0].clientX-tx, dy=e.changedTouches[0].clientY-ty;
    if(Math.abs(dx)<30&&Math.abs(dy)<30)return;
    if(Math.abs(dx)>Math.abs(dy)){
      const k=dx>0?'ArrowRight':'ArrowLeft';
      document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
      setTimeout(()=>document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})),140);
    } else {
      const k=dy>0?'ArrowDown':'ArrowUp';
      document.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));
      setTimeout(()=>document.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true})),140);
    }
  },{passive:true});
})();
