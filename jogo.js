// =====================================================
// CONFIGURAÇÕES BASE
// =====================================================
const TELA_BASE_LARGURA = 800;
const TELA_BASE_ALTURA = 600;
let escala = 1;
let TELA_LARGURA = TELA_BASE_LARGURA;
let TELA_ALTURA = TELA_BASE_ALTURA;
const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

// =====================================================
// DETECTAR DISPOSITIVO MÓVEL
// =====================================================
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
                 ('ontouchstart' in window) ||
                 (navigator.maxTouchPoints > 0);

// =====================================================
// CRIAR PAINEIS DINAMICAMENTE
// =====================================================
function criarPaineis() {
  // Painel de UPGRADE — Canto superior ESQUERDO
  const painelUpgrade = document.createElement('div');
  painelUpgrade.id = 'painel-upgrade';
  painelUpgrade.innerHTML = `
    <div class="titulo">🔫 Tiro</div>
    <div id="status-tiro"></div>
  `;
  document.body.appendChild(painelUpgrade);

  // Painel de STATUS — Canto superior DIREITO
  const painelStatus = document.createElement('div');
  painelStatus.id = 'painel-status';
  painelStatus.innerHTML = `
    <div class="titulo">📊 Status</div>
    <div>Pontos: <span id="pontos">0</span></div>
    <div>Vidas: <span id="vidas">3</span></div>
    <div>Fase: <span id="fase">1</span></div>
  `;
  document.body.appendChild(painelStatus);

  // Controles móveis — só aparecem em celulares
  if (isMobile) {
    const controles = document.createElement('div');
    controles.id = 'controles-movel';
    controles.innerHTML = `
      <div id="area-movimento"><div id="alavanca"></div></div>
      <div id="botao-atirar">ATIRAR</div>
    `;
    document.body.appendChild(controles);
    configurarControlesMovel();
  }
}

// =====================================================
// CONTROLES DE TOQUE — MÓVEL
// =====================================================
let toqueAtivo = null;
let alavanca = null;
let areaMovimento = null;

function configurarControlesMovel() {
  areaMovimento = document.getElementById('area-movimento');
  alavanca = document.getElementById('alavanca');
  const botaoAtirar = document.getElementById('botao-atirar');

  // Início do toque na área de movimento
  areaMovimento.addEventListener('touchstart', (e) => {
    e.preventDefault();
    iniciarAudio();
    const toque = e.changedTouches[0];
    toqueAtivo = { x: toque.clientX, y: toque.clientY };
    atualizarAlavanca(toque.clientX, toque.clientY);
  });

  // Movimento do dedo
  areaMovimento.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (!toqueAtivo) return;
    const toque = e.changedTouches[0];
    atualizarAlavanca(toque.clientX, toque.clientY);
  });

  // Soltar o dedo
  ['touchend', 'touchcancel'].forEach(evt => {
    areaMovimento.addEventListener(evt, (e) => {
      e.preventDefault();
      toqueAtivo = null;
      teclas['ArrowLeft'] = false;
      teclas['ArrowRight'] = false;
      if (alavanca) {
        alavanca.style.transform = 'translate(-50%, -50%)';
      }
    });
  });

  // Botão de atirar
  botaoAtirar.addEventListener('touchstart', (e) => {
    e.preventDefault();
    iniciarAudio();
    if (jogo.gameOver) {
      reiniciarJogo();
    } else {
      atirar();
    }
  });
}

function atualizarAlavanca(clientX, clientY) {
  if (!areaMovimento || !alavanca) return;
  const rect = areaMovimento.getBoundingClientRect();
  const centroX = rect.left + rect.width / 2;
  const maxDesloc = rect.width / 2 - 25;

  let deslocX = clientX - centroX;
  deslocX = Math.max(-maxDesloc, Math.min(maxDesloc, deslocX));

  // Controlar a nave
  const fator = deslocX / maxDesloc;
  teclas['ArrowLeft'] = fator < -0.1;
  teclas['ArrowRight'] = fator > 0.1;

  // Visual da alavanca
  alavanca.style.transform = `translate(calc(-50% + ${deslocX}px), -50%)`;
}

// =====================================================
// REINICIAR JOGO
// =====================================================
function reiniciarJogo() {
  jogo = {
    pontos: 0, vidas: 3, vidaAtual: TIROS_POR_VIDA,
    fase: 1, gameOver: false,
    tipoTiroAtual: TIPOS_TIRO.AMARELO, nivelPoder: 1, danoPorTiro: 1,
    cadencia: 280, tempoProximoItem: 3000
  };
  jogador.x = TELA_BASE_LARGURA / 2 - 25;
  jogador.y = TELA_BASE_ALTURA - 80;
  jogador.tiros = [];
  itensUpgrade.length = 0;
  explosoes.length = 0;
  inimigos = [];
  tirosInimigos = [];
  atualizarStatusUI();
  criarFase();
}

// =====================================================
// MÚSICA DE FUNDO
// =====================================================
let musicaFundo = null;
try {
  musicaFundo = new Audio('boogie.mp3');
  musicaFundo.loop = true;
  musicaFundo.volume = 0.20;
} catch(e) {
  console.log('⚠️ Arquivo de música não encontrado');
}

// =====================================================
// ÁUDIO — SONS
// =====================================================
let contextoAudio = null;
function iniciarAudio() {
  if (!contextoAudio) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    contextoAudio = new AudioContext();
  }
  if (musicaFundo && musicaFundo.paused) {
    musicaFundo.play().catch(() => {});
  }
}

function somTiro(tipo = 'AMARELO') {
  if (!contextoAudio) return;
  const som = contextoAudio.createOscillator();
  const volume = contextoAudio.createGain();
  som.connect(volume);
  volume.connect(contextoAudio.destination);
  switch(tipo) {
    case 'AMARELO':
      som.type = 'sine';
      som.frequency.setValueAtTime(880, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(440, contextoAudio.currentTime + 0.08);
      volume.gain.setValueAtTime(0.15, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.12);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.15);
      break;
    case 'VERDE':
      som.type = 'triangle';
      som.frequency.setValueAtTime(660, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(880, contextoAudio.currentTime + 0.10);
      volume.gain.setValueAtTime(0.18, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.15);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.18);
      break;
    case 'AZUL':
      som.type = 'sine';
      som.frequency.setValueAtTime(523, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(1047, contextoAudio.currentTime + 0.12);
      volume.gain.setValueAtTime(0.20, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.18);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.20);
      break;
    case 'ROXO':
      som.type = 'sawtooth';
      som.frequency.setValueAtTime(440, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(700, contextoAudio.currentTime + 0.15);
      volume.gain.setValueAtTime(0.16, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.20);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.22);
      break;
    case 'LARANJA':
      som.type = 'square';
      som.frequency.setValueAtTime(330, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(220, contextoAudio.currentTime + 0.10);
      volume.gain.setValueAtTime(0.22, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.15);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.18);
      break;
  }
}

function somExplosao(tamanho = 1) {
  if (!contextoAudio) return;
  const som = contextoAudio.createOscillator();
  const volume = contextoAudio.createGain();
  som.connect(volume);
  volume.connect(contextoAudio.destination);
  som.type = 'sawtooth';
  som.frequency.setValueAtTime(120 * tamanho, contextoAudio.currentTime);
  som.frequency.exponentialRampToValueAtTime(30, contextoAudio.currentTime + 0.28 * tamanho);
  volume.gain.setValueAtTime(0.70 * tamanho, contextoAudio.currentTime);
  volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.35 * tamanho);
  som.start(contextoAudio.currentTime);
  som.stop(contextoAudio.currentTime + 0.4 * tamanho);
}

// =====================================================
// TELA RESPONSIVA
// =====================================================
function ajustarTela() {
  const janelaLargura = window.innerWidth;
  const janelaAltura = window.innerHeight;
  const escalaX = janelaLargura / TELA_BASE_LARGURA;
  const escalaY = janelaAltura / TELA_BASE_ALTURA;
  escala = Math.min(escalaX, escalaY);
  TELA_LARGURA = Math.round(TELA_BASE_LARGURA * escala);
  TELA_ALTURA = Math.round(TELA_BASE_ALTURA * escala);
  canvas.width = TELA_BASE_LARGURA;
  canvas.height = TELA_BASE_ALTURA;
  canvas.style.width = `${TELA_LARGURA}px`;
  canvas.style.height = `${TELA_ALTURA}px`;
  canvas.style.position = 'absolute';
  canvas.style.left = `${(janelaLargura - TELA_LARGURA) / 2}px`;
  canvas.style.top = `${(janelaAltura - TELA_ALTURA) / 2}px`;
}
window.addEventListener('resize', ajustarTela);

// =====================================================
// SPRITES
// =====================================================
const spriteNave = new Image();
spriteNave.src = 'SF.png';
spriteNave.onerror = () => console.log('⚠️ Imagem SF.png não encontrada');
const spriteInimigo = new Image();
spriteInimigo.src = '1.png';
spriteInimigo.onerror = () => console.log('⚠️ Imagem 1.png não encontrada');

// =====================================================
// ESTRELAS DE FUNDO
// =====================================================
const estrelas = [];
const NUM_ESTRELAS = 150;
function criarEstrelas() {
  estrelas.length = 0;
  for (let i = 0; i < NUM_ESTRELAS; i++) {
    estrelas.push({
      x: Math.random() * TELA_BASE_LARGURA,
      y: Math.random() * TELA_BASE_ALTURA,
      tamanho: Math.random() * 2 + 0.5,
      velocidade: Math.random() * 2 + 0.5,
      brilho: Math.random() * 0.8 + 0.2,
      cor: ['#fff','#f0f8ff','#ffefd5','#ffd700','#ff6347','#87ceeb'][Math.floor(Math.random()*6)]
    });
  }
}

// =====================================================
// TIPOS DO JOGO
// =====================================================
const TIPOS_TIRO = {
  AMARELO: { nome: 'Tiro Reto', cor: '#ffff00', formato: 'reto', chave: 'AMARELO' },
  VERDE: { nome: 'Tiro Duplo', cor: '#00ff88', formato: 'reto', chave: 'VERDE' },
  AZUL: { nome: 'Tiro Espalhado', cor: '#00aaff', formato: 'espalhado', chave: 'AZUL' },
  ROXO: { nome: 'Tiro Curvo', cor: '#ff00ff', formato: 'curvo', chave: 'ROXO' },
  LARANJA: { nome: 'Tiro Explosivo', cor: '#ff8800', formato: 'explosivo', chave: 'LARANJA' }
};
const TIPOS_INIMIGOS = {
  FRACO: { vidaMax: 1, cor: '#66ff66', pontos: 10, tamanho: 32 },
  NORMAL: { vidaMax: 2, cor: '#ffcc00', pontos: 25, tamanho: 38 },
  FORTE:  { vidaMax: 4, cor: '#ff6600', pontos: 50, tamanho: 44 },
  CHEFE:  { vidaMax: 8, cor: '#ff0044', pontos: 150, tamanho: 52 }
};

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
const TIROS_POR_VIDA = 5;
let jogo = {
  pontos: 0, vidas: 3, vidaAtual: TIROS_POR_VIDA,
  fase: 1, gameOver: false,
  tipoTiroAtual: TIPOS_TIRO.AMARELO,
  nivelPoder: 1, danoPorTiro: 1,
  cadencia: 280, tempoProximoItem: 3000
};
let teclas = {};
const jogador = {
  x: TELA_BASE_LARGURA / 2 - 25, y: TELA_BASE_ALTURA - 80,
  largura: 50, altura: 50, velocidade: 7,
  tiros: [], podeAtirar: true,
  inclinacaoRolamento: 0, inclinacaoMax: 0.35, suavidade: 0.15
};
let inimigos = [], tirosInimigos = [], explosoes = [], itensUpgrade = [];
let ultimoTempo = 0, tempoAcumulado = 0;

// =====================================================
// EXPLOSÕES VISUAIS
// =====================================================
function criarExplosao(x, y, tamanho = 1, cor = '#ffcc00') {
  const cores = ['#ffcc00','#ff6600','#ff0000','#ffff00','#ff33aa', cor];
  const qtd = Math.floor(16 * tamanho);
  const particulas = [];
  for (let i = 0; i < qtd; i++) {
    const ang = (Math.PI * 2 / qtd) * i;
    particulas.push({
      x, y,
      vx: Math.cos(ang) * (2 + Math.random() * 2) * tamanho,
      vy: Math.sin(ang) * (2 + Math.random() * 2) * tamanho,
      cor: cores[Math.floor(Math.random() * cores.length)],
      tamanho: (3 + Math.random() * 4) * tamanho, vida: 1
    });
  }
  explosoes.push({ particulas, duracao: Math.floor(35 * tamanho) });
}

// =====================================================
// ITENS DE UPGRADE
// =====================================================
function criarItemUpgrade() {
  const tipos = Object.values(TIPOS_TIRO);
  const tipo = tipos[Math.floor(Math.random() * tipos.length)];
  itensUpgrade.push({
    x: Math.random() * (TELA_BASE_LARGURA - 80) + 40,
    y: -30, largura: 26, altura: 26,
    velocidade: 2 + Math.random() * 1.5, tipo, piscar: 0
  });
}
function coletarItemUpgrade(item) {
  if (item.tipo.chave === jogo.tipoTiroAtual.chave) {
    jogo.nivelPoder = Math.min(jogo.nivelPoder + 1, 5);
    jogo.danoPorTiro = 1 + (jogo.nivelPoder - 1) * 0.5;
    jogo.cadencia = Math.max(280 - jogo.nivelPoder * 30, 120);
  } else {
    jogo.tipoTiroAtual = item.tipo;
    jogo.nivelPoder = 1;
    jogo.danoPorTiro = 1;
    jogo.cadencia = 280;
  }
  atualizarStatusUI();
}

// =====================================================
// FUNÇÕES DE DESENHO
// =====================================================
function desenharComEscala(funcao) {
  ctx.save();
  funcao();
  ctx.restore();
}
function desenharJogador() {
  const cx = jogador.x + jogador.largura / 2;
  const cy = jogador.y + jogador.altura / 2;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.transform(1, jogador.inclinacaoRolamento, 0, 1, 0, 0);
  ctx.shadowBlur = 18;
  ctx.shadowColor = jogo.tipoTiroAtual.cor;
  if (spriteNave.complete && spriteNave.naturalWidth > 0) {
    ctx.drawImage(spriteNave, -25, -25, 50, 50);
  } else {
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.moveTo(0, -24); ctx.lineTo(-6, 18); ctx.lineTo(6, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#003399';
    ctx.beginPath();
    ctx.moveTo(-18, 20); ctx.lineTo(-8, -10); ctx.lineTo(-3, 18); ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(18, 20); ctx.lineTo(8, -10); ctx.lineTo(3, 18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = jogo.tipoTiroAtual.cor;
    ctx.beginPath();
    ctx.moveTo(0, -18); ctx.lineTo(-3, 12); ctx.lineTo(3, 12); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  const lrg = jogador.largura + 10, alt = 6;
  const x = jogador.x - 5, y = jogador.y - 15;
  const pct = jogo.vidaAtual / TIROS_POR_VIDA;
  ctx.fillStyle = '#222';
  ctx.fillRect(x, y, lrg, alt);
  let cor = '#00ff00';
  if (pct <= 0.33) cor = '#ff3333';
  else if (pct <= 0.66) cor = '#ffcc00';
  ctx.fillStyle = cor;
  ctx.shadowBlur = 6;
  ctx.shadowColor = cor;
  ctx.fillRect(x, y, lrg * pct, alt);
  ctx.shadowBlur = 0;
}
function desenharInimigo(inf) {
  const tipo = inf.tipo;
  const tamanho = tipo.tamanho;
  const cx = inf.x + inf.largura / 2;
  const cy = inf.y + inf.altura / 2;
  ctx.save();
  ctx.translate(cx, cy);
  if (spriteInimigo.complete && spriteInimigo.naturalWidth > 0) {
    ctx.rotate(Math.PI);
    ctx.drawImage(spriteInimigo, -tamanho / 2, -tamanho / 2, tamanho, tamanho);
    ctx.rotate(-Math.PI);
  } else {
    ctx.fillStyle = tipo.cor;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, tamanho / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-6, -4, 4, 0, Math.PI * 2);
    ctx.arc(6, -4, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, 6, 6, 0, Math.PI);
    ctx.fill();
  }
  ctx.restore();
  const pct = inf.vida / tipo.vidaMax;
  const corBarra = pct > 0.5 ? '#00ff00' : pct > 0.25 ? '#ffcc00' : '#ff0000';
  ctx.fillStyle = '#333';
  ctx.fillRect(inf.x, inf.y - 10, inf.largura, 5);
  ctx.fillStyle = corBarra;
  ctx.fillRect(inf.x, inf.y - 10, inf.largura * pct, 5);
}
function desenharTiro(tiro) {
  ctx.shadowBlur = 12;
  ctx.shadowColor = tiro.cor;
  ctx.fillStyle = tiro.cor;
  ctx.fillRect(tiro.x, tiro.y, 4, 15);
  ctx.shadowBlur = 0;
}
function desenharItemUpgrade(item) {
  item.piscar += 0.15;
  const brilho = 0.7 + Math.sin(item.piscar) * 0.3;
  ctx.save();
  ctx.translate(item.x + item.largura / 2, item.y + item.altura / 2);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = item.tipo.cor;
  ctx.globalAlpha = brilho;
  ctx.shadowBlur = 18;
  ctx.shadowColor = item.tipo.cor;
  ctx.fillRect(-item.largura / 2, -item.altura / 2, item.largura, item.altura);
  ctx.restore();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('★', item.x + item.largura / 2, item.y + item.altura / 2);
}

// =====================================================
// COLISÕES E DANO
// =====================================================
function colide(a, b) {
  return a.x < b.x + (b.largura || 0) && a.x + (a.largura || 4) > b.x &&
         a.y < b.y + (b.altura || 0) && a.y + (a.altura || 15) > b.y;
}
function colideItem(a, b) {
  return a.x < b.x + b.largura && a.x + jogador.largura > b.x &&
         a.y < b.y + b.altura && a.y + jogador.altura > b.y;
}
function receberDano(qtd = 1) {
  jogo.vidaAtual -= qtd;
  while (jogo.vidaAtual <= 0 && jogo.vidas > 0) {
    jogo.vidas--;
    jogo.vidaAtual = TIROS_POR_VIDA;
  }
  if (jogo.vidas <= 0) {
    jogo.vidaAtual = 0;
    jogo.gameOver = true;
  }
  atualizarStatusUI();
}

// =====================================================
// ATIRAR — TIROS MÚLTIPLOS POR NÍVEL
// =====================================================
function atirar() {
  if (jogo.gameOver || !jogador.podeAtirar) return;
  somTiro(jogo.tipoTiroAtual.chave);
  const tirosPorNivel = jogo.nivelPoder;
  const espacamento = 12;
  for (let i = 0; i < tirosPorNivel; i++) {
    const deslocamentoX = (i - (tirosPorNivel - 1) / 2) * espacamento;
    jogador.tiros.push({
      x: jogador.x + jogador.largura / 2 - 2 + deslocamentoX,
      y: jogador.y,
      vx: 0,
      cor: jogo.tipoTiroAtual.cor,
      formato: jogo.tipoTiroAtual.formato,
      dano: jogo.danoPorTiro
    });
  }
  jogador.podeAtirar = false;
  setTimeout(() => jogador.podeAtirar = true, Math.max(jogo.cadencia - jogo.nivelPoder * 30, 120));
}

// =====================================================
// CRIAR FASE
// =====================================================
function criarFase() {
  inimigos = []; tirosInimigos = [];
  const linhas = 3 + Math.min(jogo.fase - 1, 4);
  const cols = 5 + Math.min(jogo.fase - 1, 4);
  const espX = 75, espY = 65, inicioX = 60, inicioY = 40;
  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < cols; c++) {
      let tipo;
      const s = Math.random();
      if (jogo.fase <= 2) tipo = s < 0.7 ? TIPOS_INIMIGOS.FRACO : TIPOS_INIMIGOS.NORMAL;
      else if (jogo.fase <= 4) tipo = s < 0.45 ? TIPOS_INIMIGOS.FRACO : s < 0.8 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      else tipo = s < 0.25 ? TIPOS_INIMIGOS.FRACO : s < 0.55 ? TIPOS_INIMIGOS.NORMAL : s < 0.85 ? TIPOS_INIMIGOS.FORTE : TIPOS_INIMIGOS.CHEFE;
      inimigos.push({
        x: inicioX + c * espX, y: inicioY + l * espY,
        largura: tipo.tamanho, altura: tipo.tamanho,
        velocidadeX: 1 + jogo.fase * 0.15,
        ultimoTiro: Date.now(), intervaloTiro: Math.max(1800 - jogo.fase * 120, 700) + Math.random() * 2500,
        tipo, vida: tipo.vidaMax
      });
    }
  }
}

// =====================================================
// ATUALIZAR INTERFACE
// =====================================================
function atualizarStatusUI() {
  const elStatusTiro = document.getElementById('status-tiro');
  const elPontos = document.getElementById('pontos');
  const elVidas = document.getElementById('vidas');
  const elFase = document.getElementById('fase');
  if (elStatusTiro) {
    elStatusTiro.innerHTML = `${jogo.tipoTiroAtual.nome}<br>⭐ Nível: ${jogo.nivelPoder}/5<br>💥 Dano: ${jogo.danoPorTiro.toFixed(1)}<br>🚀 Tiros: ${jogo.nivelPoder}`;
  }
  if (elPontos) elPontos.textContent = jogo.pontos;
  if (elVidas) elVidas.textContent = jogo.vidas;
  if (elFase) elFase.textContent = jogo.fase;
}

// =====================================================
// LOOP PRINCIPAL
// =====================================================
function loop(tempoAtual) {
  if (!jogo.gameOver) {
    const delta = tempoAtual - ultimoTempo;
    ultimoTempo = tempoAtual;
    tempoAcumulado += delta;
    
    // Gerar itens de upgrade
    if (tempoAcumulado > jogo.tempoProximoItem) {
      criarItemUpgrade();
      jogo.tempoProximoItem = 2500 + Math.random() * 3500;
      tempoAcumulado = 0;
    }
    
    // Movimento do jogador
    if (teclas['ArrowLeft'] && jogador.x > 0) {
      jogador.x -= jogador.velocidade;
      jogador.inclinacaoRolamento = -jogador.inclinacaoMax;
    } else if (teclas['ArrowRight'] && jogador.x < TELA_BASE_LARGURA - jogador.largura) {
      jogador.x += jogador.velocidade;
      jogador.inclinacaoRolamento = jogador.inclinacaoMax;
    } else {
      jogador.inclinacaoRolamento *= 0.85;
    }
    
    // Mover tiros
    jogador.tiros = jogador.tiros.filter(t => { t.y -= 10; return t.y > -20; });
    
    // Itens de upgrade
    itensUpgrade.forEach((item, idx) => {
      item.y += item.velocidade;
      if (colideItem(jogador, item)) {
        coletarItemUpgrade(item);
        itensUpgrade.splice(idx, 1);
      }
    });
    itensUpgrade = itensUpgrade.filter(i => i.y < TELA_BASE_ALTURA + 50);
    
    // Movimento inimigos
    let bateuParede = false;
    const agora = Date.now();
    inimigos.forEach(inf => {
      inf.x += inf.velocidadeX;
      if (inf.x <= 0 || inf.x >= TELA_BASE_LARGURA - inf.largura) bateuParede = true;
      if (agora - inf.ultimoTiro > inf.intervaloTiro) {
        tirosInimigos.push({ x: inf.x + inf.largura / 2 - 2, y: inf.y + inf.altura, largura: 4, altura: 15 });
        inf.ultimoTiro = agora;
      }
    });
    if (bateuParede) inimigos.forEach(inf => { inf.velocidadeX *= -1; inf.y += 20; });
    
    tirosInimigos = tirosInimigos.filter(t => { t.y += 4 + jogo.fase * 0.3; return t.y < TELA_BASE_ALTURA + 20; });
    
    // Colisão tiros com inimigos
    jogador.tiros.forEach((tiro, i) => {
      for (let j = inimigos.length - 1; j >= 0; j--) {
        const inf = inimigos[j];
        if (colide(tiro, inf)) {
          jogador.tiros.splice(i, 1);
          inf.vida -= tiro.dano;
          if (inf.vida <= 0) {
            criarExplosao(inf.x + inf.largura / 2, inf.y + inf.altura / 2, 1, inf.tipo.cor);
            somExplosao(1);
            jogo.pontos += inf.tipo.pontos * jogo.fase;
            atualizarStatusUI();
            inimigos.splice(j, 1);
          }
          break;
        }
      }
    });
    
    // Colisão tiros inimigos com jogador
    tirosInimigos.forEach((tiro, i) => {
      if (colide(tiro, jogador)) {
        tirosInimigos.splice(i, 1);
        criarExplosao(jogador.x + jogador.largura / 2, jogador.y + jogador.altura / 2, 0.8);
        somExplosao(0.5);
        receberDano(1);
      }
    });
    
    // Próxima fase
    if (inimigos.length === 0) {
      jogo.fase++;
      atualizarStatusUI();
      criarFase();
    }
    
    // Atualizar explosões
    explosoes = explosoes.filter(e => {
      e.duracao--;
      e.particulas.forEach(p => { p.x += p.vx; p.y += p.vy; p.vida -= 0.03; });
      return e.duracao > 0;
    });
  }
  
  // Desenhar tudo
  ctx.fillStyle = '#050b18';
  ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);
  
  // Estrelas
  estrelas.forEach(e => {
    e.y += e.velocidade;
    if (e.y > TELA_BASE_ALTURA) { e.y = 0; e.x = Math.random() * TELA_BASE_LARGURA; }
    ctx.fillStyle = e.cor;
    ctx.globalAlpha = e.brilho;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.tamanho, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  
  // Itens
  itensUpgrade.forEach(i => desenharItemUpgrade(i));
  
  // Jogador e tiros
  desenharJogador();
  jogador.tiros.forEach(t => desenharTiro(t));
  
  // Inimigos e tiros inimigos
  inimigos.forEach(i => desenharInimigo(i));
  tirosInimigos.forEach(t => {
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(t.x, t.y, 4, 15);
  });
  
  // Explosões
  explosoes.forEach(e => e.particulas.forEach(p => {
    if (p.vida <= 0) return;
    ctx.globalAlpha = p.vida;
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
    ctx.fill();
  }));
  ctx.globalAlpha = 1;
  
  // Game Over
  if (jogo.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 50px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💀 GAME OVER 💀', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 - 30);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Pontuação: ${jogo.pontos}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 20);
    ctx.fillText(`Fase: ${jogo.fase}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 55);
    ctx.fillText(isMobile ? 'Toque para reiniciar' : 'ESPAÇO para reiniciar', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 100);
  }
  
  requestAnimationFrame(loop);
}

// =====================================================
// CONTROLES DO TECLADO (computador)
// =====================================================
window.addEventListener('keydown', e => {
  teclas[e.key] = true;
  if (e.key === ' ') {
    e.preventDefault();
    iniciarAudio();
    if (jogo.gameOver) {
      reiniciarJogo();
    } else {
      atirar();
    }
  }
});
window.addEventListener('keyup', e => {
  teclas[e.key] = false;
});

// =====================================================
// INICIAR TUDO
// =====================================================
criarPaineis();
ajustarTela();
criarEstrelas();
atualizarStatusUI();
ultimoTempo = performance.now();
criarFase();
requestAnimationFrame(loop);