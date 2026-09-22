// =====================================================
// CONFIGURAÇÕES BASE
// =====================================================
const TELA_BASE_LARGURA = 800;
const TELA_BASE_ALTURA = 600;
const LINHA_NAVE = TELA_BASE_ALTURA - 100;
const MAX_FILAS = 6;
const FASES_PARA_CHEFE = 5;

let escala = 1;
let TELA_LARGURA = TELA_BASE_LARGURA;
let TELA_ALTURA = TELA_BASE_ALTURA;
const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

// =====================================================
// DETECTAR DISPOSITIVO MÓVEL
// =====================================================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                  ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

// =====================================================
// SISTEMA DE PAUSA
// =====================================================
let jogoPausado = false;
function alternarPausa() {
  if (jogo.gameOver || jogoVitoria) return;
  jogoPausado = !jogoPausado;
  const botao = document.getElementById('botao-pausa');
  if (botao) botao.innerHTML = jogoPausado ? '▶️ Retomar' : '⏸️ Pausa';
  if (jogoPausado) {
    segurandoEspaco = false;
    if (intervaloTiroTeclado) { clearInterval(intervaloTiroTeclado); intervaloTiroTeclado = null; }
    segurandoTiro = false;
    if (intervaloTiroContinuo) { clearInterval(intervaloTiroContinuo); intervaloTiroContinuo = null; }
  }
}

// =====================================================
// CONTROLES DE TOQUE — MÓVEL
// =====================================================
let toqueAtivo = null, alavanca = null, areaMovimento = null;
let segurandoTiro = false, intervaloTiroContinuo = null;

function configurarControlesMovel() {
  areaMovimento = document.getElementById('area-movimento');
  alavanca = document.getElementById('alavanca');
  const botaoAtirar = document.getElementById('botao-atirar');
  const botaoBomba = document.getElementById('botao-bomba');

  if (areaMovimento) {
    areaMovimento.addEventListener('touchstart', e => {
      e.preventDefault(); iniciarAudio();
      const t = e.changedTouches[0];
      toqueAtivo = { x: t.clientX, y: t.clientY };
      atualizarAlavanca(t.clientX, t.clientY);
    });
    areaMovimento.addEventListener('touchmove', e => {
      e.preventDefault(); if (!toqueAtivo) return;
      atualizarAlavanca(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });
    ['touchend','touchcancel'].forEach(evt => {
      areaMovimento.addEventListener(evt, e => {
        e.preventDefault(); toqueAtivo = null;
        teclas['ArrowLeft'] = teclas['ArrowRight'] = false;
        if (alavanca) alavanca.style.transform = 'translate(-50%, -50%)';
      });
    });
  }

  if (botaoAtirar) {
    botaoAtirar.addEventListener('touchstart', e => {
      e.preventDefault(); iniciarAudio();
      if (jogo.gameOver || jogoVitoria) { reiniciarJogo(); return; }
      if (jogoPausado) { alternarPausa(); return; }
      segurandoTiro = true; atirar();
      intervaloTiroContinuo = setInterval(() => {
        if (segurandoTiro && !jogoPausado && !jogo.gameOver && !jogoVitoria) atirar();
      }, Math.max(jogo.cadencia, 120));
    });
    botaoAtirar.addEventListener('touchend', e => {
      e.preventDefault(); segurandoTiro = false;
      if (intervaloTiroContinuo) { clearInterval(intervaloTiroContinuo); intervaloTiroContinuo = null; }
    });
  }
  if (botaoBomba) botaoBomba.addEventListener('touchstart', e => { e.preventDefault(); usarBomba(); });
}

function atualizarAlavanca(clientX, clientY) {
  if (!areaMovimento || !alavanca) return;
  const rect = areaMovimento.getBoundingClientRect();
  const centroX = rect.left + rect.width/2;
  const maxDesloc = rect.width/2 - 25;
  let deslocX = clientX - centroX;
  deslocX = Math.max(-maxDesloc, Math.min(maxDesloc, deslocX));
  const fator = deslocX / maxDesloc;
  teclas['ArrowLeft'] = fator < -0.1;
  teclas['ArrowRight'] = fator > 0.1;
  alavanca.style.transform = `translate(calc(-50% + ${deslocX}px), -50%)`;
}

// =====================================================
// ÁUDIO
// =====================================================
let musicaFundo = null, contextoAudio = null;
try { musicaFundo = new Audio('boogie.mp3'); musicaFundo.loop = true; musicaFundo.volume = 0.20; }
catch(e) { console.log('⚠️ Arquivo de música não encontrado'); }

function iniciarAudio() {
  if (!contextoAudio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    contextoAudio = new AudioContext();
  }
  if (musicaFundo && musicaFundo.paused) musicaFundo.play().catch(()=>{});
}

function somTiro(tipo = 'AMARELO') {
  if (!contextoAudio) return;
  const som = contextoAudio.createOscillator();
  const vol = contextoAudio.createGain();
  som.connect(vol); vol.connect(contextoAudio.destination);
  switch(tipo) {
    case 'AMARELO':
      som.type='sine'; som.frequency.setValueAtTime(880,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(440,contextoAudio.currentTime+0.08);
      vol.gain.setValueAtTime(0.15,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.12);
      som.start(); som.stop(contextoAudio.currentTime+0.15); break;
    case 'VERDE':
      som.type='triangle'; som.frequency.setValueAtTime(660,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(880,contextoAudio.currentTime+0.10);
      vol.gain.setValueAtTime(0.18,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.15);
      som.start(); som.stop(contextoAudio.currentTime+0.18); break;
    case 'AZUL':
      som.type='sawtooth'; som.frequency.setValueAtTime(523,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(1047,contextoAudio.currentTime+0.08);
      som.frequency.exponentialRampToValueAtTime(300,contextoAudio.currentTime+0.15);
      vol.gain.setValueAtTime(0.30,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.20);
      som.start(); som.stop(contextoAudio.currentTime+0.20); break;
    case 'ROXO':
      som.type='sawtooth'; som.frequency.setValueAtTime(440,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(700,contextoAudio.currentTime+0.15);
      vol.gain.setValueAtTime(0.16,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.22);
      som.start(); som.stop(contextoAudio.currentTime+0.22); break;
    case 'LARANJA':
      som.type='square'; som.frequency.setValueAtTime(330,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(220,contextoAudio.currentTime+0.10);
      vol.gain.setValueAtTime(0.22,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.15);
      som.start(); som.stop(contextoAudio.currentTime+0.18); break;
    case 'ESCUDO':
      som.type='triangle';
      som.frequency.setValueAtTime(523,contextoAudio.currentTime);
      som.frequency.setValueAtTime(659,contextoAudio.currentTime+0.1);
      som.frequency.setValueAtTime(784,contextoAudio.currentTime+0.2);
      vol.gain.setValueAtTime(0.25,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.3);
      som.start(); som.stop(contextoAudio.currentTime+0.3); break;
    case 'ESCUDO_DANO':
      som.type='sine'; som.frequency.setValueAtTime(320,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(150,contextoAudio.currentTime+0.15);
      vol.gain.setValueAtTime(0.3,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.2);
      som.start(); som.stop(contextoAudio.currentTime+0.2); break;
    case 'BOMBA':
      som.type='sawtooth'; som.frequency.setValueAtTime(150,contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(30,contextoAudio.currentTime+0.4);
      vol.gain.setValueAtTime(0.8,contextoAudio.currentTime);
      vol.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.5);
      som.start(); som.stop(contextoAudio.currentTime+0.5); break;
  }
}

function somExplosao(tam=1) {
  if (!contextoAudio) return;
  const s = contextoAudio.createOscillator(), v = contextoAudio.createGain();
  s.connect(v); v.connect(contextoAudio.destination);
  s.type='sawtooth';
  s.frequency.setValueAtTime(120*tam,contextoAudio.currentTime);
  s.frequency.exponentialRampToValueAtTime(30,contextoAudio.currentTime+0.28*tam);
  v.gain.setValueAtTime(0.70*tam,contextoAudio.currentTime);
  v.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.35*tam);
  s.start(); s.stop(contextoAudio.currentTime+0.4*tam);
}

function somColetarCoracao() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type='sine';
  o.frequency.setValueAtTime(523,contextoAudio.currentTime);
  o.frequency.setValueAtTime(659,contextoAudio.currentTime+0.1);
  o.frequency.setValueAtTime(784,contextoAudio.currentTime+0.2);
  g.gain.setValueAtTime(0,contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.25,contextoAudio.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.4);
  o.start(); o.stop(contextoAudio.currentTime+0.4);
}
function somColetarBomba() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type='sawtooth'; o.frequency.setValueAtTime(220,contextoAudio.currentTime);
  o.frequency.exponentialRampToValueAtTime(110,contextoAudio.currentTime+0.2);
  g.gain.setValueAtTime(0,contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.2,contextoAudio.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.25);
  o.start(); o.stop(contextoAudio.currentTime+0.25);
}
function somColetarEscudo() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type='triangle'; o.frequency.setValueAtTime(392,contextoAudio.currentTime);
  o.frequency.setValueAtTime(523,contextoAudio.currentTime+0.15);
  g.gain.setValueAtTime(0,contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.22,contextoAudio.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.35);
  o.start(); o.stop(contextoAudio.currentTime+0.35);
}
function somColetarTiro() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type='square'; o.frequency.setValueAtTime(440,contextoAudio.currentTime);
  o.frequency.setValueAtTime(587,contextoAudio.currentTime+0.08);
  g.gain.setValueAtTime(0,contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.18,contextoAudio.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.2);
  o.start(); o.stop(contextoAudio.currentTime+0.2);
}
function somSubirNivel() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator(), g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type='sine';
  o.frequency.setValueAtTime(330,contextoAudio.currentTime);
  o.frequency.setValueAtTime(440,contextoAudio.currentTime+0.1);
  o.frequency.setValueAtTime(554,contextoAudio.currentTime+0.2);
  g.gain.setValueAtTime(0,contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.2,contextoAudio.currentTime+0.02);
  g.gain.exponentialRampToValueAtTime(0.001,contextoAudio.currentTime+0.3);
  o.start(); o.stop(contextoAudio.currentTime+0.3);
}

// =====================================================
// TELA RESPONSIVA
// =====================================================
function ajustarTela() {
  const w = window.innerWidth, h = window.innerHeight;
  escala = Math.min(w/TELA_BASE_LARGURA, h/TELA_BASE_ALTURA);
  TELA_LARGURA = Math.round(TELA_BASE_LARGURA*escala);
  TELA_ALTURA = Math.round(TELA_BASE_ALTURA*escala);
  canvas.width = TELA_BASE_LARGURA; canvas.height = TELA_BASE_ALTURA;
  canvas.style.width = `${TELA_LARGURA}px`;
  canvas.style.height = `${TELA_ALTURA}px`;
  canvas.style.position='absolute';
  canvas.style.left = `${(w-TELA_LARGURA)/2}px`;
  canvas.style.top = `${(h-TELA_ALTURA)/2}px`;
}
window.addEventListener('resize', ajustarTela);

// =====================================================
// SPRITES
// =====================================================
const spriteNave = new Image(); spriteNave.src='SF.png';
spriteNave.onerror = ()=>console.log('⚠️ Imagem SF.png não encontrada');
const spriteInimigo = new Image(); spriteInimigo.src='1.png';
spriteInimigo.onerror = ()=>console.log('⚠️ Imagem 1.png não encontrada');

// =====================================================
// ESTRELAS
// =====================================================
const estrelas = [];
function criarEstrelas() {
  estrelas.length=0;
  for(let i=0;i<150;i++) estrelas.push({
    x:Math.random()*TELA_BASE_LARGURA, y:Math.random()*TELA_BASE_ALTURA,
    tamanho:Math.random()*2+0.5, velocidade:Math.random()*2+0.5,
    brilho:Math.random()*0.8+0.2,
    cor:['#fff','#f0f8ff','#ffefd5','#ffd700','#ff6347','#87ceeb'][Math.floor(Math.random()*6)]
  });
}

// =====================================================
// TIPOS
// =====================================================
const TIPOS_TIRO = {
  AMARELO: {nome:'Tiro Reto', cor:'#ffff00', formato:'reto', chave:'AMARELO'},
  VERDE: {nome:'Tiro Duplo', cor:'#00ff88', formato:'reto', chave:'VERDE'},
  AZUL: {nome:'Trovão Elétrico', cor:'#00ccff', formato:'trovao', chave:'AZUL'},
  ROXO: {nome:'Tiro Curvo', cor:'#ff00ff', formato:'curvo', chave:'ROXO'},
  LARANJA: {nome:'Tiro Explosivo', cor:'#ff8800', formato:'explosivo', chave:'LARANJA'}
};
const TIPOS_INIMIGOS = {
  FRACO: {vidaMax:1, cor:'#66ff66', pontos:10, tamanho:32},
  NORMAL: {vidaMax:2, cor:'#ffcc00', pontos:25, tamanho:38},
  FORTE: {vidaMax:4, cor:'#ff6600', pontos:50, tamanho:44},
  CHEFE: {vidaMax:8, cor:'#ff0044', pontos:150, tamanho:52}
};
const TIPO_ITEM_ESCUDO = {ehEscudo:true, cor:'#00ccff', nome:'Escudo'};
const TIPO_ITEM_BOMBA = {ehBomba:true, cor:'#ff3300', nome:'Bomba'};
const TIPO_ITEM_CORACAO = {ehCoracao:true, cor:'#ff3366', nome:'Vida Completa'};

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
const TIROS_POR_VIDA = 5;
let jogo = {
  pontos:0, vidas:3, vidaAtual:TIROS_POR_VIDA,
  fase:1, gameOver:false,
  tipoTiroAtual:TIPOS_TIRO.AMARELO, nivelPoder:1, danoPorTiro:1,
  cadencia:280, tempoProximoItem:3000,
  escudo:null, bombas:0,
  chefeAtivo:false, chefe:null
};
let jogoVitoria = false, tempoVitoria = 0;
let teclas = {}, segurandoEspaco = false, intervaloTiroTeclado = null;
const jogador = {
  x:TELA_BASE_LARGURA/2-25, y:TELA_BASE_ALTURA-80,
  largura:50, altura:50, velocidade:7,
  tiros:[], podeAtirar:true,
  inclinacaoRolamento:0, inclinacaoMax:0.45, suavidade:0.12
};
let inimigos = [], tirosInimigos = [], explosoes = [], itensUpgrade = [];
let raiosAtivos = [];
let ultimoTempo = 0, tempoAcumulado = 0;

// =====================================================
// REINICIAR JOGO COMPLETO
// =====================================================
function reiniciarJogo() {
  jogoVitoria = false;
  segurandoEspaco = false; if(intervaloTiroTeclado){clearInterval(intervaloTiroTeclado); intervaloTiroTeclado=null;}
  segurandoTiro = false; if(intervaloTiroContinuo){clearInterval(intervaloTiroContinuo); intervaloTiroContinuo=null;}
  jogo = {
    pontos:0, vidas:3, vidaAtual:TIROS_POR_VIDA,
    fase:1, gameOver:false,
    tipoTiroAtual:TIPOS_TIRO.AMARELO, nivelPoder:1, danoPorTiro:1,
    cadencia:280, tempoProximoItem:3000,
    escudo:null, bombas:0, chefeAtivo:false, chefe:null
  };
  jogador.x=TELA_BASE_LARGURA/2-25; jogador.y=TELA_BASE_ALTURA-80;
  jogador.inclinacaoRolamento=0; jogador.tiros=[]; jogador.podeAtirar=true;
  inimigos=[]; tirosInimigos=[]; explosoes=[]; itensUpgrade=[]; raiosAtivos=[];
  jogoPausado=false;
  const btn=document.getElementById('botao-pausa'); if(btn) btn.innerHTML='⏸️ Pausa';
  criarFase(); atualizarStatusUI();
}

// =====================================================
// SISTEMA DE ESCUDO
// =====================================================
function ativarEscudo() {
  jogo.escudo = {vidas:3, raio:38, opacidade:1, pulso:0};
  somTiro('ESCUDO'); atualizarStatusUI();
}
function escudoReceberDano() {
  if(!jogo.escudo) return false;
  jogo.escudo.vidas--; somTiro('ESCUDO_DANO');
  if(jogo.escudo.vidas<=0) jogo.escudo=null;
  atualizarStatusUI(); return true;
}
function desenharEscudo() {
  if(!jogo.escudo) return;
  const cx = jogador.x+jogador.largura/2, cy = jogador.y+jogador.altura/2;
  const esc = jogo.escudo; esc.pulso += 0.1;
  const brilho = 0.6+Math.sin(esc.pulso)*0.15;
  const raioAtual = esc.raio+Math.sin(esc.pulso*1.5)*2;
  let cor='#00ccff';
  if(esc.vidas===2) cor='#ffcc00';
  if(esc.vidas===1) cor='#ff4444';
  ctx.save(); ctx.globalAlpha=brilho;
  ctx.strokeStyle=cor; ctx.lineWidth=4; ctx.shadowBlur=15; ctx.shadowColor=cor;
  ctx.beginPath(); ctx.arc(cx,cy,raioAtual,0,Math.PI*2); ctx.stroke();
  ctx.globalAlpha=brilho*0.4; ctx.lineWidth=2;
  ctx.beginPath(); ctx.arc(cx,cy,raioAtual-6,0,Math.PI*2); ctx.stroke();
  ctx.restore();
}

// =====================================================
// SISTEMA DE BOMBAS
// =====================================================
function coletarBomba() { if(jogo.bombas<3){jogo.bombas++; atualizarStatusUI();} }
function usarBomba() {
  if(jogo.bombas<=0 || jogoPausado || jogo.gameOver || jogoVitoria) return;
  jogo.bombas--; somTiro('BOMBA');
  for(let i=inimigos.length-1; i>=0; i--) {
    const inf = inimigos[i];
    criarExplosao(inf.x+inf.largura/2, inf.y+inf.altura/2, 1.5, inf.tipo.cor);
    somExplosao(1.5);
    jogo.pontos += inf.tipo.pontos * jogo.fase;
  }
  inimigos = []; tirosInimigos = []; atualizarStatusUI();
}

// =====================================================
// EXPLOSÕES
// =====================================================
function criarExplosao(x,y,tam=1,cor='#ffcc00') {
  const cores = ['#ffcc00','#ff6600','#ff0000','#ffff00','#ff33aa',cor];
  const qtd = Math.floor(16*tam), part = [];
  for(let i=0;i<qtd;i++) {
    const ang = (Math.PI*2/qtd)*i;
    part.push({
      x,y,
      vx:Math.cos(ang)*(2+Math.random()*2)*tam,
      vy:Math.sin(ang)*(2+Math.random()*2)*tam,
      cor:cores[Math.floor(Math.random()*cores.length)],
      tamanho:(3+Math.random()*4)*tam, vida:1
    });
  }
  explosoes.push({particulas:part, duracao:Math.floor(35*tam)});
}

// =====================================================
// CORRENTE ELÉTRICA
// =====================================================
function criarCorrenteElétrica(origemX, origemY, alvo, dano) {
  alvo.vida -= dano;
  raiosAtivos.push({
    x1:origemX, y1:origemY,
    x2:alvo.x+alvo.largura/2, y2:alvo.y+alvo.altura/2,
    duracao:25, espessura:3+Math.random()*2
  });
  if(alvo.vida <= 0) {
    criarExplosao(alvo.x+alvo.largura/2, alvo.y+alvo.altura/2, 0.8, '#00ccff');
    somExplosao(0.8);
    jogo.pontos += alvo.tipo.pontos * jogo.fase;
    atualizarStatusUI();
  }
  const alcance = 180, maxAlvos = 3;
  let atingidos = 1;
  for(let i=0; i<inimigos.length && atingidos<maxAlvos; i++) {
    const c = inimigos[i];
    if(c===alvo || c.vida<=0) continue;
    const dist = Math.hypot(c.x+c.largura/2-(alvo.x+alvo.largura/2), c.y+c.altura/2-(alvo.y+alvo.altura/2));
    if(dist < alcance) {
      criarCorrenteElétrica(alvo.x+alvo.largura/2, alvo.y+alvo.altura/2, c, dano*0.7);
      atingidos++;
    }
  }
}

// =====================================================
// ITENS DE UPGRADE
// =====================================================
function criarItemUpgrade() {
  const todos = [TIPO_ITEM_BOMBA, TIPO_ITEM_CORACAO, TIPO_ITEM_ESCUDO, ...Object.values(TIPOS_TIRO)];
  itensUpgrade.push({
    x:Math.random()*(TELA_BASE_LARGURA-80)+40, y:-30,
    largura:26, altura:26, velocidade:2+Math.random()*1.5,
    tipo: todos[Math.floor(Math.random()*todos.length)],
    piscar:0
  });
}
function coletarItemUpgrade(item) {
  if(item.tipo.ehBomba){coletarBomba(); somColetarBomba(); return;}
  if(item.tipo.ehCoracao){jogo.vidas=3; jogo.vidaAtual=TIROS_POR_VIDA; atualizarStatusUI(); somColetarCoracao(); return;}
  if(item.tipo.ehEscudo){ativarEscudo(); somColetarEscudo(); return;}
  if(item.tipo.chave === jogo.tipoTiroAtual.chave) {
    jogo.nivelPoder = Math.min(jogo.nivelPoder+1,5);
    jogo.danoPorTiro = 1+(jogo.nivelPoder-1)*0.5;
    jogo.cadencia = Math.max(280-jogo.nivelPoder*30,120);
    somSubirNivel();
  } else {
    jogo.tipoTiroAtual = item.tipo;
    jogo.nivelPoder=1; jogo.danoPorTiro=1; jogo.cadencia=280;
    somColetarTiro();
  }
  atualizarStatusUI();
}

// =====================================================
// DESENHAR JOGADOR
// =====================================================
function desenharJogador() {
  const cx = jogador.x+jogador.largura/2, cy = jogador.y+jogador.altura/2;
  let alvoInclinacao = 0;
  if(teclas['ArrowLeft'] || teclas['a']) alvoInclinacao = -jogador.inclinacaoMax;
  else if(teclas['ArrowRight'] || teclas['d']) alvoInclinacao = jogador.inclinacaoMax;
  jogador.inclinacaoRolamento += (alvoInclinacao - jogador.inclinacaoRolamento)*jogador.suavidade;

  ctx.save();
  ctx.translate(cx,cy);
  ctx.transform(1, jogador.inclinacaoRolamento, 0, 1, 0, 0);
  ctx.shadowBlur=18; ctx.shadowColor=jogo.tipoTiroAtual.cor;
  if(spriteNave.complete && spriteNave.naturalWidth>0) {
    ctx.drawImage(spriteNave,-25,-25,50,50);
  } else {
    ctx.fillStyle='#f5f5f5';
    ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(-6,18); ctx.lineTo(6,18); ctx.closePath(); ctx.fill();
    ctx.fillStyle='#003399';
    ctx.beginPath(); ctx.moveTo(-18,20); ctx.lineTo(-8,-10); ctx.lineTo(-3,18); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(18,20); ctx.lineTo(8,-10); ctx.lineTo(3,18); ctx.closePath(); ctx.fill();
    ctx.fillStyle=jogo.tipoTiroAtual.cor;
    ctx.beginPath(); ctx.moveTo(0,-18); ctx.lineTo(-3,12); ctx.lineTo(3,12); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  desenharEscudo();

  const lrg = jogador.largura+10, alt=6, x=jogador.x-5, y=jogador.y-15;
  const pct = jogo.vidaAtual/TIROS_POR_VIDA;
  ctx.fillStyle='#222'; ctx.fillRect(x,y,lrg,alt);
  let corBarra = '#00ff00';
  if(pct<=0.33) corBarra='#ff3333';
  else if(pct<=0.66) corBarra='#ffcc00';
  ctx.fillStyle=corBarra; ctx.shadowBlur=6; ctx.shadowColor=corBarra;
  ctx.fillRect(x,y,lrg*pct,alt); ctx.shadowBlur=0;
}

function desenharInimigo(inf) {
  const tipo = inf.tipo, tam = tipo.tamanho;
  const cx = inf.x+inf.largura/2, cy = inf.y+inf.altura/2;
  ctx.save(); ctx.translate(cx,cy);
  if(spriteInimigo.complete && spriteInimigo.naturalWidth>0) {
    ctx.rotate(Math.PI); ctx.drawImage(spriteInimigo,-tam/2,-tam/2,tam,tam);
  } else {
    ctx.fillStyle=tipo.cor; ctx.globalAlpha=0.6;
    ctx.beginPath(); ctx.arc(0,0,tam/2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#000'; ctx.globalAlpha=1;
    ctx.beginPath(); ctx.arc(-6,-4,4,0,Math.PI*2); ctx.arc(6,-4,4,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(0,6,6,0,Math.PI); ctx.fill();
  }
  ctx.restore();
  const pct = inf.vida/tipo.vidaMax;
  const corBar = pct>0.5?'#00ff00':pct>0.25?'#ffcc00':'#ff0000';
  ctx.fillStyle='#333'; ctx.fillRect(inf.x,inf.y-10,inf.largura,5);
  ctx.fillStyle=corBar; ctx.fillRect(inf.x,inf.y-10,inf.largura*pct,5);
}

function desenharTiro(tiro) {
  ctx.shadowBlur=15; ctx.shadowColor=tiro.cor;
  if(tiro.formato === 'trovao') {
    ctx.fillStyle='#fff'; ctx.fillRect(tiro.x+1,tiro.y,2,18);
    ctx.fillStyle=tiro.cor; ctx.fillRect(tiro.x-1,tiro.y,6,18);
    ctx.fillStyle='#aaddff'; ctx.fillRect(tiro.x,tiro.y+3,4,12);
  } else {
    ctx.fillStyle=tiro.cor; ctx.fillRect(tiro.x,tiro.y,4,15);
  }
  ctx.shadowBlur=0;
}

function desenharItemUpgrade(item) {
  item.piscar += 0.15;
  const brilho = 0.7+Math.sin(item.piscar)*0.3;
  ctx.save(); ctx.translate(item.x+item.largura/2, item.y+item.altura/2);
  if(item.tipo.ehBomba) {
    ctx.fillStyle=item.tipo.cor; ctx.globalAlpha=brilho; ctx.shadowBlur=18; ctx.shadowColor=item.tipo.cor;
    ctx.beginPath(); ctx.arc(0,2,11,0,Math.PI*2); ctx.fill();
    ctx.fillRect(-2,-12,4,8);
    ctx.font='bold 10px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('💣',0,3);
  } else if(item.tipo.ehCoracao) {
    ctx.fillStyle=item.tipo.cor; ctx.globalAlpha=brilho; ctx.shadowBlur=18; ctx.shadowColor=item.tipo.cor;
    ctx.font='bold 20px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('❤️',0,2);
  } else if(item.tipo.ehEscudo) {
    ctx.strokeStyle=item.tipo.cor; ctx.lineWidth=3; ctx.globalAlpha=brilho; ctx.shadowBlur=18; ctx.shadowColor=item.tipo.cor;
    ctx.beginPath(); ctx.arc(0,0,12,0,Math.PI*2); ctx.stroke();
    ctx.fillStyle='#fff'; ctx.font='bold 14px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('🛡',0,1);
  } else {
    ctx.rotate(Math.PI/4); ctx.fillStyle=item.tipo.cor; ctx.globalAlpha=brilho; ctx.shadowBlur=18; ctx.shadowColor=item.tipo.cor;
    ctx.fillRect(-item.largura/2,-item.altura/2,item.largura,item.altura);
    ctx.restore();
    ctx.fillStyle='#fff'; ctx.font='bold 12px Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('★',item.x+item.largura/2,item.y+item.altura/2);
    return;
  }
  ctx.restore();
}

// =====================================================
// COLISÕES
// =====================================================
function colide(a,b) {
  return a.x < (b.x||0)+(b.largura||0) && a.x+(a.largura||4) > (b.x||0) &&
         a.y < (b.y||0)+(b.altura||0) && a.y+(a.altura||15) > (b.y||0);
}
function colideItem(a,b) {
  return a.x < b.x+b.largura && a.x+jogador.largura > b.x &&
         a.y < b.y+b.altura && a.y+jogador.altura > b.y;
}
function receberDano(qtd=1) {
  for(let i=0;i<qtd;i++) {
    if(escudoReceberDano()) continue;
    criarExplosao(jogador.x+jogador.largura/2, jogador.y+jogador.altura/2, 1.2, '#ffcc00');
    somExplosao(1.2);
    jogo.vidaAtual--;
    while(jogo.vidaAtual<=0 && jogo.vidas>0) {
      jogo.vidas--; jogo.vidaAtual=TIROS_POR_VIDA;
      jogador.x=TELA_BASE_LARGURA/2-25; jogador.y=TELA_BASE_ALTURA-80;
      jogador.inclinacaoRolamento=0;
    }
    if(jogo.vidas<=0) {
      jogo.vidaAtual=0; jogo.gameOver=true;
      segurandoEspaco=false; if(intervaloTiroTeclado){clearInterval(intervaloTiroTeclado); intervaloTiroTeclado=null;}
      segurandoTiro=false; if(intervaloTiroContinuo){clearInterval(intervaloTiroContinuo); intervaloTiroContinuo=null;}
    }
  }
  atualizarStatusUI();
}

// =====================================================
// ATIRAR
// =====================================================
function atirar() {
  if(jogo.gameOver || jogoVitoria || jogoPausado || !jogador.podeAtirar) return;
  somTiro(jogo.tipoTiroAtual.chave);
  const qtd = jogo.nivelPoder, esp=12;
  for(let i=0;i<qtd;i++) {
    const desl = (i-(qtd-1)/2)*esp;
    jogador.tiros.push({
      x: jogador.x+jogador.largura/2-2+desl,
      y: jogador.y, vx:0,
      cor: jogo.tipoTiroAtual.cor,
      formato: jogo.tipoTiroAtual.formato,
      dano: jogo.danoPorTiro
    });
  }
  jogador.podeAtirar = false;
  setTimeout(()=>jogador.podeAtirar=true, Math.max(jogo.cadencia,120));
}

// =====================================================
// CHEFE
// =====================================================
function criarChefe() {
  jogo.chefeAtivo = true;
  const vidaBase = 50 + Math.floor(jogo.fase/FASES_PARA_CHEFE)*15;
  jogo.chefe = {
    x: TELA_BASE_LARGURA/2 - 75, y: -100,
    largura: 150, altura: 80,
    vida: vidaBase, vidaMax: vidaBase,
    tempoMovimento: 0, tempoTiro: 0,
    direcao: 1
  };
}

function desenharChefe() {
  if(!jogo.chefeAtivo || !jogo.chefe) return;
  const ch = jogo.chefe;

  ctx.fillStyle='#cc2222'; ctx.shadowBlur=12; ctx.shadowColor='#ff4444';
  ctx.fillRect(ch.x, ch.y, ch.largura, ch.altura);

  ctx.fillStyle='#ffcc00';
  ctx.fillRect(ch.x+15, ch.y+15, 30, 30);
  ctx.fillRect(ch.x+ch.largura-45, ch.y+15, 30, 30);

  ctx.fillStyle='#222';
  ctx.fillRect(ch.x+50, ch.y+45, 50, 15);

  const barL = 200, barX = TELA_BASE_LARGURA/2 - barL/2, barY=15;
  const pct = ch.vida/ch.vidaMax;
  ctx.fillStyle='#333'; ctx.fillRect(barX,barY,barL,12);
  ctx.fillStyle='#ff2222'; ctx.fillRect(barX,barY,barL*pct,12);
  ctx.strokeStyle='#fff'; ctx.lineWidth=1; ctx.strokeRect(barX,barY,barL,12);
  ctx.fillStyle='#fff'; ctx.font='bold 11px Arial'; ctx.textAlign='center';
  ctx.fillText('👑 CHEFE', TELA_BASE_LARGURA/2, barY+9);
  ctx.shadowBlur=0;
}

function atualizarChefe(delta) {
  if(!jogo.chefeAtivo || !jogo.chefe) return;
  const ch = jogo.chefe;

  if(ch.y < 40) {
    ch.y += 0.8;
    return;
  }

  ch.tempoMovimento += delta;
  ch.tempoTiro += delta;

  ch.x += ch.direcao * 1.2;
  if(ch.x <= 20 || ch.x + ch.largura >= TELA_BASE_LARGURA - 20) {
    ch.direcao *= -1;
  }

  if(ch.tempoTiro > 1200) {
    ch.tempoTiro = 0;
    const quantTiros = 2 + Math.floor(jogo.fase/FASES_PARA_CHEFE);
    for(let i=0; i<quantTiros; i++) {
      const desvio = (i - (quantTiros-1)/2) * 40;
      tirosInimigos.push({
        x: ch.x + ch.largura/2 - 2 + desvio,
        y: ch.y + ch.altura,
        largura: 4, altura: 12,
        velocidade: 4 + jogo.fase * 0.2,
        cor: '#ff4444'
      });
    }
  }
}

function chefeReceberDano(dano) {
  if(!jogo.chefe) return false;
  jogo.chefe.vida -= dano;
  if(jogo.chefe.vida <= 0) {
    criarExplosao(jogo.chefe.x + jogo.chefe.largura/2, jogo.chefe.y + jogo.chefe.altura/2, 2, '#ff4444');
    somExplosao(2);
    jogo.pontos += 300 * jogo.fase;
    jogo.chefeAtivo = false;
    jogo.chefe = null;
    jogo.fase++;
    criarFase();
    atualizarStatusUI();
  }
  return true;
}

// =====================================================
// CRIAR FASE — LIMITA 6 FILAS, CHEFE A CADA 5 FASES
// =====================================================
function criarFase() {
  inimigos = []; tirosInimigos = [];

  if(jogo.fase % FASES_PARA_CHEFE === 0) {
    if(!jogo.chefeAtivo) criarChefe();
    return;
  }

  jogo.chefeAtivo = false; jogo.chefe = null;

  const filas = Math.min(3 + Math.floor((jogo.fase-1)/2), MAX_FILAS);
  const cols = Math.min(5 + Math.floor(jogo.fase/2), 10);
  const espX = 75, espY = 65, inicioX = 40, inicioY = 40;

  for(let l=0; l<filas; l++) {
    for(let c=0; c<cols; c++) {
      let tipo;
      const r = Math.random();
      if(jogo.fase <= 2) {
        tipo = r < 0.7 ? TIPOS_INIMIGOS.FRACO : TIPOS_INIMIGOS.NORMAL;
      } else if(jogo.fase <= 4) {
        tipo = r < 0.4 ? TIPOS_INIMIGOS.FRACO :
               r < 0.8 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      } else {
        tipo = r < 0.2 ? TIPOS_INIMIGOS.FRACO :
               r < 0.6 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      }

      inimigos.push({
        x: inicioX + c * espX,
        y: inicioY + l * espY,
        largura: tipo.tamanho,
        altura: tipo.tamanho,
        vida: tipo.vidaMax + Math.floor(jogo.fase/3),
        tipo: tipo,
        direcao: 1
      });
    }
  }
}

// =====================================================
// ATUALIZAR INIMIGOS
// =====================================================
function atualizarInimigos(delta) {
  if(inimigos.length === 0 && !jogo.chefeAtivo && !jogoVitoria && !jogo.gameOver) {
    jogo.fase++;
    criarFase();
    return;
  }

  const velBase = 0.4 + jogo.fase * 0.06;
  const descida = 18;
  let bateuParede = false;

  for(const inf of inimigos) {
    inf.x += velBase * inf.direcao;
    if(inf.x <= 10 || inf.x + inf.largura >= TELA_BASE_LARGURA - 10) {
      bateuParede = true;
    }
  }

  if(bateuParede) {
    for(const inf of inimigos) {
      inf.direcao *= -1;
      inf.y += descida;
      if(inf.y + inf.altura >= jogador.y) {
        receberDano(99);
      }
    }
  }

  const taxaTiro = Math.max(1200, 3000 - jogo.fase * 180);
  if(Math.random() < delta/taxaTiro && inimigos.length > 0) {
    const alvo = inimigos[Math.floor(Math.random() * inimigos.length)];
    tirosInimigos.push({
      x: alvo.x + alvo.largura/2 - 2,
      y: alvo.y + alvo.altura,
      largura: 4, altura: 12,
      velocidade: 3 + jogo.fase * 0.15,
      cor: alvo.tipo.cor
    });
  }
}

// =====================================================
// ATUALIZAR TIROS DO JOGADOR
// =====================================================
function atualizarTiros(delta) {
  for(let i = jogador.tiros.length - 1; i >= 0; i--) {
    const t = jogador.tiros[i];
    t.y -= 10;
    if(t.formato === 'curvo') t.vx = Math.sin(t.y/30)*2.5;
    t.x += t.vx;

    if(t.y < 0 || t.x < 0 || t.x > TELA_BASE_LARGURA) {
      jogador.tiros.splice(i,1);
      continue;
    }

    let acertou = false;
    for(let j = inimigos.length - 1; j >= 0; j--) {
      const inf = inimigos[j];
      if(colide(t, inf)) {
        acertou = true;
        inf.vida -= t.dano;

        if(t.formato === 'explosivo') {
          criarExplosao(t.x, t.y, 1.2, t.cor);
          // Dano em área
          for(let k = inimigos.length - 1; k >= 0; k--) {
            if(k === j) continue;
            const outro = inimigos[k];
            const dist = Math.hypot(outro.x + outro.largura/2 - t.x, outro.y + outro.altura/2 - t.y);
            if(dist < 60) {
              outro.vida -= t.dano * 0.5;
              if(outro.vida <= 0) {
                criarExplosao(outro.x+outro.largura/2, outro.y+outro.altura/2, 0.8, outro.tipo.cor);
                somExplosao(0.8);
                jogo.pontos += outro.tipo.pontos * jogo.fase;
                inimigos.splice(k, 1);
              }
            }
          }
        }
        else if(t.formato === 'trovao') {
          criarCorrenteElétrica(t.x, t.y, inf, t.dano);
        }

        if(inf.vida <= 0) {
          criarExplosao(inf.x+inf.largura/2, inf.y+inf.altura/2, 1, inf.tipo.cor);
          somExplosao(1);
          jogo.pontos += inf.tipo.pontos * jogo.fase;
          inimigos.splice(j, 1);
          // Chance de dropar item
          if(Math.random() < 0.15) {
            criarItemUpgrade();
          }
        }
        break;
      }
    }

    // Verificar acerto no chefe
    if(!acertou && jogo.chefeAtivo && jogo.chefe) {
      if(colide(t, jogo.chefe)) {
        acertou = true;
        chefeReceberDano(t.dano);
      }
    }

    if(acertou) {
      jogador.tiros.splice(i, 1);
    }
  }
}
