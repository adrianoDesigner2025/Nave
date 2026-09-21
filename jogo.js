// =====================================================
// CONFIGURAÇÕES BASE
// =====================================================
const TELA_BASE_LARGURA = 800;
const TELA_BASE_ALTURA = 600;
const LINHA_NAVE = TELA_BASE_ALTURA - 100;
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
  const painelUpgrade = document.createElement('div');
  painelUpgrade.id = 'painel-upgrade';
  painelUpgrade.innerHTML = `
    <div class="titulo" id="titulo-tiro">🔫 Tiro</div>
    <div id="status-tiro"></div>
    <div id="status-bombas" style="margin-top:8px;">💣 Bombas: <span id="qtd-bombas">0</span>/3</div>
    <div id="status-escudo" style="margin-top:8px;display:none;">🛡️ Escudo: <span id="escudo-vidas">3</span>/3</div>
  `;
  document.body.appendChild(painelUpgrade);

  const painelStatus = document.createElement('div');
  painelStatus.id = 'painel-status';
  painelStatus.innerHTML = `
    <div class="titulo">📊 Status</div>
    <div>Pontos: <span id="pontos">0</span></div>
    <div>Vidas: <span id="vidas">3</span></div>
    <div>Fase: <span id="fase">1</span></div>
  `;
  document.body.appendChild(painelStatus);

  const botaoPausa = document.createElement('button');
  botaoPausa.id = 'botao-pausa';
  botaoPausa.innerHTML = '⏸️ Pausa';
  botaoPausa.addEventListener('click', alternarPausa);
  document.body.appendChild(botaoPausa);

  if (isMobile) {
    const controles = document.createElement('div');
    controles.id = 'controles-movel';
    controles.innerHTML = `
      <div id="area-movimento"><div id="alavanca"></div></div>
      <div style="display:flex;gap:10px;align-items:center;">
        <button id="botao-bomba" style="width:70px;height:70px;background:linear-gradient(135deg,#ff2222,#ff6600);border-radius:50%;border:none;color:#fff;font-weight:bold;display:none;cursor:pointer;">💣</button>
        <div id="botao-atirar">ATIRAR</div>
      </div>
    `;
    document.body.appendChild(controles);
    configurarControlesMovel();
  }
}

// =====================================================
// SISTEMA DE PAUSA
// =====================================================
let jogoPausado = false;
function alternarPausa() {
  if (jogo.gameOver || jogoVitoria) return;
  jogoPausado = !jogoPausado;
  const botao = document.getElementById('botao-pausa');
  if (botao) {
    botao.innerHTML = jogoPausado ? '▶️ Retomar' : '⏸️ Pausa';
  }
  if (jogoPausado) {
    segurandoEspaco = false;
    if (intervaloTiroTeclado) {
      clearInterval(intervaloTiroTeclado);
      intervaloTiroTeclado = null;
    }
    segurandoTiro = false;
    if (intervaloTiroContinuo) {
      clearInterval(intervaloTiroContinuo);
      intervaloTiroContinuo = null;
    }
  }
}

// =====================================================
// CONTROLES DE TOQUE — MÓVEL
// =====================================================
let toqueAtivo = null;
let alavanca = null;
let areaMovimento = null;
let segurandoTiro = false;
let intervaloTiroContinuo = null;

function configurarControlesMovel() {
  areaMovimento = document.getElementById('area-movimento');
  alavanca = document.getElementById('alavanca');
  const botaoAtirar = document.getElementById('botao-atirar');
  const botaoBomba = document.getElementById('botao-bomba');

  if (areaMovimento) {
    areaMovimento.addEventListener('touchstart', (e) => {
      e.preventDefault();
      iniciarAudio();
      const toque = e.changedTouches[0];
      toqueAtivo = { x: toque.clientX, y: toque.clientY };
      atualizarAlavanca(toque.clientX, toque.clientY);
    });
    areaMovimento.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (!toqueAtivo) return;
      const toque = e.changedTouches[0];
      atualizarAlavanca(toque.clientX, toque.clientY);
    });
    ['touchend', 'touchcancel'].forEach(evt => {
      areaMovimento.addEventListener(evt, (e) => {
        e.preventDefault();
        toqueAtivo = null;
        teclas['ArrowLeft'] = false;
        teclas['ArrowRight'] = false;
        if (alavanca) alavanca.style.transform = 'translate(-50%, -50%)';
      });
    });
  }

  if (botaoAtirar) {
    botaoAtirar.addEventListener('touchstart', (e) => {
      e.preventDefault();
      iniciarAudio();
      if (jogo.gameOver) {
        reiniciarJogo();
        return;
      }
      if (jogoPausado) {
        alternarPausa();
        return;
      }
      if (!jogoPausado) {
        segurandoTiro = true;
        atirar();
        intervaloTiroContinuo = setInterval(() => {
          if (segurandoTiro && !jogoPausado && !jogo.gameOver && !jogoVitoria) atirar();
        }, Math.max(jogo.cadencia, 120));
      }
    });
    botaoAtirar.addEventListener('touchend', (e) => {
      e.preventDefault();
      segurandoTiro = false;
      if (intervaloTiroContinuo) {
        clearInterval(intervaloTiroContinuo);
        intervaloTiroContinuo = null;
      }
    });
  }

  if (botaoBomba) {
    botaoBomba.addEventListener('touchstart', (e) => {
      e.preventDefault();
      usarBomba();
    });
  }
}

function atualizarAlavanca(clientX, clientY) {
  if (!areaMovimento || !alavanca) return;
  const rect = areaMovimento.getBoundingClientRect();
  const centroX = rect.left + rect.width / 2;
  const maxDesloc = rect.width / 2 - 25;
  let deslocX = clientX - centroX;
  deslocX = Math.max(-maxDesloc, Math.min(maxDesloc, deslocX));
  const fator = deslocX / maxDesloc;
  teclas['ArrowLeft'] = fator < -0.1;
  teclas['ArrowRight'] = fator > 0.1;
  alavanca.style.transform = `translate(calc(-50% + ${deslocX}px), -50%)`;
}

// =====================================================
// ÁUDIO E MÚSICA
// =====================================================
let musicaFundo = null;
try {
  musicaFundo = new Audio('boogie.mp3');
  musicaFundo.loop = true;
  musicaFundo.volume = 0.20;
} catch(e) {
  console.log('⚠️ Arquivo de música não encontrado');
}

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
      som.type = 'sawtooth';
      som.frequency.setValueAtTime(523, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(1047, contextoAudio.currentTime + 0.08);
      som.frequency.exponentialRampToValueAtTime(300, contextoAudio.currentTime + 0.15);
      volume.gain.setValueAtTime(0.30, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.20);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.20);
      break;
    case 'ROXO':
      som.type = 'sawtooth';
      som.frequency.setValueAtTime(440, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(700, contextoAudio.currentTime + 0.15);
      volume.gain.setValueAtTime(0.16, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.22);
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
    case 'ESCUDO':
      som.type = 'triangle';
      som.frequency.setValueAtTime(523, contextoAudio.currentTime);
      som.frequency.setValueAtTime(659, contextoAudio.currentTime + 0.1);
      som.frequency.setValueAtTime(784, contextoAudio.currentTime + 0.2);
      volume.gain.setValueAtTime(0.25, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.3);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.3);
      break;
    case 'ESCUDO_DANO':
      som.type = 'sine';
      som.frequency.setValueAtTime(320, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(150, contextoAudio.currentTime + 0.15);
      volume.gain.setValueAtTime(0.3, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.2);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.2);
      break;
    case 'BOMBA':
      som.type = 'sawtooth';
      som.frequency.setValueAtTime(150, contextoAudio.currentTime);
      som.frequency.exponentialRampToValueAtTime(30, contextoAudio.currentTime + 0.4);
      volume.gain.setValueAtTime(0.8, contextoAudio.currentTime);
      volume.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.5);
      som.start(contextoAudio.currentTime);
      som.stop(contextoAudio.currentTime + 0.5);
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

function somColetarCoracao() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
  const g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(523, contextoAudio.currentTime);
  o.frequency.setValueAtTime(659, contextoAudio.currentTime + 0.1);
  o.frequency.setValueAtTime(784, contextoAudio.currentTime + 0.2);
  g.gain.setValueAtTime(0, contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.25, contextoAudio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.4);
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.4);
}

function somColetarBomba() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
  const g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(220, contextoAudio.currentTime);
  o.frequency.exponentialRampToValueAtTime(110, contextoAudio.currentTime + 0.2);
  g.gain.setValueAtTime(0, contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.2, contextoAudio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.25);
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.25);
}

function somColetarEscudo() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
  const g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type = 'triangle';
  o.frequency.setValueAtTime(392, contextoAudio.currentTime);
  o.frequency.setValueAtTime(523, contextoAudio.currentTime + 0.15);
  g.gain.setValueAtTime(0, contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.22, contextoAudio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.35);
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.35);
}

function somColetarTiro() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
  const g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type = 'square';
  o.frequency.setValueAtTime(440, contextoAudio.currentTime);
  o.frequency.setValueAtTime(587, contextoAudio.currentTime + 0.08);
  g.gain.setValueAtTime(0, contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.18, contextoAudio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.2);
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.2);
}

function somSubirNivel() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
  const g = contextoAudio.createGain();
  o.connect(g); g.connect(contextoAudio.destination);
  o.type = 'sine';
  o.frequency.setValueAtTime(330, contextoAudio.currentTime);
  o.frequency.setValueAtTime(440, contextoAudio.currentTime + 0.1);
  o.frequency.setValueAtTime(554, contextoAudio.currentTime + 0.2);
  g.gain.setValueAtTime(0, contextoAudio.currentTime);
  g.gain.linearRampToValueAtTime(0.2, contextoAudio.currentTime + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, contextoAudio.currentTime + 0.3);
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.3);
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
  AZUL: { nome: 'Trovão Elétrico', cor: '#00ccff', formato: 'trovao', chave: 'AZUL' },
  ROXO: { nome: 'Tiro Curvo', cor: '#ff00ff', formato: 'curvo', chave: 'ROXO' },
  LARANJA: { nome: 'Tiro Explosivo', cor: '#ff8800', formato: 'explosivo', chave: 'LARANJA' }
};

const TIPOS_INIMIGOS = {
  FRACO: { vidaMax: 1, cor: '#66ff66', pontos: 10, tamanho: 32 },
  NORMAL: { vidaMax: 2, cor: '#ffcc00', pontos: 25, tamanho: 38 },
  FORTE:  { vidaMax: 4, cor: '#ff6600', pontos: 50, tamanho: 44 },
  CHEFE:  { vidaMax: 8, cor: '#ff0044', pontos: 150, tamanho: 52 }
};

const TIPO_ITEM_ESCUDO = { ehEscudo: true, cor: '#00ccff', nome: 'Escudo' };
const TIPO_ITEM_BOMBA = { ehBomba: true, cor: '#ff3300', nome: 'Bomba' };
const TIPO_ITEM_CORACAO = { ehCoracao: true, cor: '#ff3366', nome: 'Vida Completa' };

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
const TIROS_POR_VIDA = 5;
let jogo = {
  pontos: 0, vidas: 3, vidaAtual: TIROS_POR_VIDA,
  fase: 1, gameOver: false,
  tipoTiroAtual: TIPOS_TIRO.AMARELO, nivelPoder: 1, danoPorTiro: 1,
  cadencia: 280, tempoProximoItem: 3000,
  escudo: null, bombas: 0,
  chefeAtivo: false, chefe: null, avisoChefeMostrado: false
};

// =====================================================
// VITÓRIA — MISSÃO CUMPRIDA
// =====================================================
let jogoVitoria = false;
let tempoVitoria = 0;

let teclas = {};
let segurandoEspaco = false;
let intervaloTiroTeclado = null;

const jogador = {
  x: TELA_BASE_LARGURA / 2 - 25, y: TELA_BASE_ALTURA - 80,
  largura: 50, altura: 50, velocidade: 7,
  tiros: [], podeAtirar: true,
  inclinacaoRolamento: 0, inclinacaoMax: 0.45, suavidade: 0.12
};

let inimigos = [], tirosInimigos = [], explosoes = [], itensUpgrade = [];
let ultimoTempo = 0, tempoAcumulado = 0;

// =====================================================
// AVANÇAR PARA PRÓXIMA FASE — CICLO COMPLETO
// =====================================================
function avancarParaProximaFase() {
  jogoVitoria = false;

  // Avança a fase — NÃO zera!
  jogo.fase++;

  // Recupera 1 vida se estiver faltando
  if (jogo.vidas < 3) {
    jogo.vidas++;
    jogo.vidaAtual = TIROS_POR_VIDA;
  }

  // Sai do modo chefe → volta para fases normais
  jogo.chefeAtivo = false;
  jogo.chefe = null;
  jogo.avisoChefeMostrado = false;

  // Reposiciona nave
  jogador.x = TELA_BASE_LARGURA / 2 - jogador.largura / 2;
  jogador.y = TELA_BASE_ALTURA - 80;
  jogador.inclinacaoRolamento = 0;
  jogador.tiros = [];

  // Limpa tudo
  inimigos = [];
  tirosInimigos = [];
  explosoes = [];
  itensUpgrade = [];

  // Cria próxima fase — decide automaticamente: inimigos ou chefe
  //criarFase();
  atualizarStatusUI();
}

// =====================================================
// REINICIAR JOGO COMPLETO
// =====================================================
function reiniciarJogo() {
  jogoVitoria = false;
  
  segurandoEspaco = false;
  if (intervaloTiroTeclado) {
    clearInterval(intervaloTiroTeclado);
    intervaloTiroTeclado = null;
  }
  segurandoTiro = false;
  if (intervaloTiroContinuo) {
    clearInterval(intervaloTiroContinuo);
    intervaloTiroContinuo = null;
  }

  jogo = {
    pontos: 0, 
    vidas: 3, 
    vidaAtual: TIROS_POR_VIDA,
    fase: 1, 
    gameOver: false,
    tipoTiroAtual: TIPOS_TIRO.AMARELO, 
    nivelPoder: 1, 
    danoPorTiro: 1,
    cadencia: 280, 
    tempoProximoItem: 3000,
    escudo: null, 
    bombas: 0,
    chefeAtivo: false, 
    chefe: null, 
    avisoChefeMostrado: false
  };

  jogador.x = TELA_BASE_LARGURA / 2 - 25;
  jogador.y = TELA_BASE_ALTURA - 80;
  jogador.inclinacaoRolamento = 0;
  jogador.tiros = [];
  jogador.podeAtirar = true;

  inimigos = [];
  tirosInimigos = [];
  explosoes = [];
  itensUpgrade = [];

  jogoPausado = false;
  const botao = document.getElementById('botao-pausa');
  if (botao) botao.innerHTML = '⏸️ Pausa';

  criarFase();
  atualizarStatusUI();
}

// =====================================================
// SISTEMA DE ESCUDO
// =====================================================
function ativarEscudo() {
  jogo.escudo = { vidas: 3, raio: 38, opacidade: 1, pulso: 0 };
  somTiro('ESCUDO');
  atualizarStatusUI();
}

function escudoReceberDano() {
  if (!jogo.escudo) return false;
  jogo.escudo.vidas--;
  somTiro('ESCUDO_DANO');
  if (jogo.escudo.vidas <= 0) jogo.escudo = null;
  atualizarStatusUI();
  return true;
}

function desenharEscudo() {
  if (!jogo.escudo) return;
  const cx = jogador.x + jogador.largura / 2;
  const cy = jogador.y + jogador.altura / 2;
  const esc = jogo.escudo;
  esc.pulso += 0.1;
  const brilho = 0.6 + Math.sin(esc.pulso) * 0.15;
  const raioAtual = esc.raio + Math.sin(esc.pulso * 1.5) * 2;
  let cor = '#00ccff';
  if (esc.vidas === 2) cor = '#ffcc00';
  if (esc.vidas === 1) cor = '#ff4444';
  ctx.save();
  ctx.globalAlpha = brilho;
  ctx.strokeStyle = cor;
  ctx.lineWidth = 4;
  ctx.shadowBlur = 15;
  ctx.shadowColor = cor;
  ctx.beginPath();
  ctx.arc(cx, cy, raioAtual, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = brilho * 0.4;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, raioAtual - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// =====================================================
// SISTEMA DE BOMBAS
// =====================================================
function coletarBomba() {
  if (jogo.bombas < 3) {
    jogo.bombas++;
    atualizarStatusUI();
  }
}

function usarBomba() {
  if (jogo.bombas <= 0 || jogoPausado || jogo.gameOver || jogoVitoria) return;
  jogo.bombas--;
  somTiro('BOMBA');
  for (let i = inimigos.length - 1; i >= 0; i--) {
    const inf = inimigos[i];
    criarExplosao(inf.x + inf.largura / 2, inf.y + inf.altura / 2, 1.5, inf.tipo.cor);
    somExplosao(1.5);
    jogo.pontos += inf.tipo.pontos * jogo.fase;
  }
  inimigos = [];
  tirosInimigos = [];
  atualizarStatusUI();
}

// =====================================================
// EXPLOSÕES
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
// ⚡ CORRENTE ELÉTRICA — TROVÃO EM CADEIA
// =====================================================
function criarCorrenteElétrica(origemX, origemY, alvo, dano) {
  // Aplica dano no alvo
  alvo.vida -= dano;
  
  // Registra o raio visual
  raiosAtivos.push({
    x1: origemX,
    y1: origemY,
    x2: alvo.x + alvo.largura / 2,
    y2: alvo.y + alvo.altura / 2,
    duracao: 25,
    espessura: 3 + Math.random() * 2
  });
  
  // Se o alvo morreu, cria efeito e pontos
  if (alvo.vida <= 0) {
    criarExplosao(alvo.x + alvo.largura / 2, alvo.y + alvo.altura / 2, 0.8, '#00ccff');
    somExplosao(0.8);
    jogo.pontos += alvo.tipo.pontos * jogo.fase;
    atualizarStatusUI();
  }
  
  // ⚡ EFEITO EM CADEIA: busca mais inimigos próximos para conduzir a corrente
  const alcanceCadeia = 180; // Alcance da corrente entre inimigos
  const maxAlvos = 3; // Máximo de inimigos atingidos por tiro
  let alvosAtingidos = 1;
  
  for (let i = 0; i < inimigos.length && alvosAtingidos < maxAlvos; i++) {
    const candidato = inimigos[i];
    if (candidato === alvo || candidato.vida <= 0) continue;
    
    const dist = Math.hypot(
      candidato.x + candidato.largura / 2 - (alvo.x + alvo.largura / 2),
      candidato.y + candidato.altura / 2 - (alvo.y + alvo.altura / 2)
    );
    
    if (dist < alcanceCadeia) {
      criarCorrenteElétrica(
        alvo.x + alvo.largura / 2,
        alvo.y + alvo.altura / 2,
        candidato,
        dano * 0.7 // Dano reduz na cadeia
      );
      alvosAtingidos++;
    }
  }
}

// =====================================================
// ITENS DE UPGRADE
// =====================================================
function criarItemUpgrade() {
  const todosTipos = [
    TIPO_ITEM_BOMBA,
    TIPO_ITEM_CORACAO,
    TIPO_ITEM_ESCUDO,
    ...Object.values(TIPOS_TIRO)
  ];
  const indice = Math.floor(Math.random() * todosTipos.length);
  const tipoSorteado = todosTipos[indice];
  itensUpgrade.push({
    x: Math.random() * (TELA_BASE_LARGURA - 80) + 40,
    y: -30,
    largura: 26,
    altura: 26,
    velocidade: 2 + Math.random() * 1.5,
    tipo: tipoSorteado,
    piscar: 0
  });
}

function coletarItemUpgrade(item) {
  if (item.tipo.ehBomba) {
    coletarBomba();
    somColetarBomba();
    return;
  }
  if (item.tipo.ehCoracao) {
    jogo.vidas = 3;
    jogo.vidaAtual = TIROS_POR_VIDA;
    atualizarStatusUI();
    somColetarCoracao();
    return;
  }
  if (item.tipo.ehEscudo) {
    ativarEscudo();
    somColetarEscudo();
    return;
  }
  if (item.tipo.chave === jogo.tipoTiroAtual.chave) {
    jogo.nivelPoder = Math.min(jogo.nivelPoder + 1, 5);
    jogo.danoPorTiro = 1 + (jogo.nivelPoder - 1) * 0.5;
    jogo.cadencia = Math.max(280 - jogo.nivelPoder * 30, 120);
    somSubirNivel();
  } else {
    jogo.tipoTiroAtual = item.tipo;
    jogo.nivelPoder = 1;
    jogo.danoPorTiro = 1;
    jogo.cadencia = 280;
    somColetarTiro();
  }
  atualizarStatusUI(); // ✅ Sempre atualiza, inclusive na mudança de tipo
}

// =====================================================
// DESENHAR JOGADOR — INCLINAÇÃO CORRIGIDA
// =====================================================
function desenharJogador() {
  const cx = jogador.x + jogador.largura / 2;
  const cy = jogador.y + jogador.altura / 2;
  
  let alvoInclinacao = 0;
  if (teclas['ArrowLeft']) {
    alvoInclinacao = -jogador.inclinacaoMax;
  } else if (teclas['ArrowRight']) {
    alvoInclinacao = jogador.inclinacaoMax;
  }
  
  jogador.inclinacaoRolamento += (alvoInclinacao - jogador.inclinacaoRolamento) * jogador.suavidade;

  ctx.save();
  ctx.translate(cx, cy);

  const fatorInclinacao = jogador.inclinacaoRolamento;
  ctx.transform(1, fatorInclinacao, 0, 1, 0, 0);

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
  
  desenharEscudo();
  
  ctx.strokeStyle = 'rgba(255, 80, 80, 0)';
  ctx.lineWidth = 1;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(0, LINHA_NAVE);
  ctx.lineTo(TELA_BASE_LARGURA, LINHA_NAVE);
  ctx.stroke();
  ctx.setLineDash([]);
  
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
  ctx.shadowBlur = 15;
  ctx.shadowColor = tiro.cor;
  
  if (tiro.formato === 'trovao') {
    // ⚡ Visual do Trovão — raio brilhante com núcleo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(tiro.x + 1, tiro.y, 2, 18); // Núcleo branco
    ctx.fillStyle = tiro.cor;
    ctx.fillRect(tiro.x - 1, tiro.y, 6, 18); // Corpo do raio
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(tiro.x, tiro.y + 3, 4, 12); // Brilho interno
  } else {
    ctx.fillStyle = tiro.cor;
    ctx.fillRect(tiro.x, tiro.y, 4, 15);
  }
  ctx.shadowBlur = 0;
}

function desenharItemUpgrade(item) {
  item.piscar += 0.15;
  const brilho = 0.7 + Math.sin(item.piscar) * 0.3;
  ctx.save();
  ctx.translate(item.x + item.largura / 2, item.y + item.altura / 2);
  
  if (item.tipo.ehBomba) {
    ctx.fillStyle = item.tipo.cor;
    ctx.globalAlpha = brilho;
    ctx.shadowBlur = 18;
    ctx.shadowColor = item.tipo.cor;
    ctx.beginPath();
    ctx.arc(0, 2, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-2, -12, 4, 8);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('💣', 0, 3);
  } else if (item.tipo.ehCoracao) {
    ctx.fillStyle = item.tipo.cor;
    ctx.globalAlpha = brilho;
    ctx.shadowBlur = 18;
    ctx.shadowColor = item.tipo.cor;
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('❤️', 0, 2); 
  } else if (item.tipo.ehEscudo) {
    ctx.strokeStyle = item.tipo.cor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = brilho;
    ctx.shadowBlur = 18;
    ctx.shadowColor = item.tipo.cor;
    ctx.beginPath();
    ctx.arc(0, 0, 12, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🛡', 0, 1);
  } else {
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
    return;
  }
  ctx.restore();
}

// =====================================================
// COLISÕES
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
  for (let i = 0; i < qtd; i++) {
    if (escudoReceberDano()) continue;
    
    criarExplosao(jogador.x + jogador.largura / 2, jogador.y + jogador.altura / 2, 1.2, '#ffcc00');
    somExplosao(1.2);
    
    jogo.vidaAtual--;
    while (jogo.vidaAtual <= 0 && jogo.vidas > 0) {
      jogo.vidas--;
      jogo.vidaAtual = TIROS_POR_VIDA;
      
      jogador.x = TELA_BASE_LARGURA / 2 - jogador.largura / 2;
      jogador.y = TELA_BASE_ALTURA - 80;
      jogador.inclinacaoRolamento = 0;
    }
    
    if (jogo.vidas <= 0) {
      jogo.vidaAtual = 0;
      jogo.gameOver = true;
      segurandoEspaco = false;
      if (intervaloTiroTeclado) clearInterval(intervaloTiroTeclado);
      segurandoTiro = false;
      if (intervaloTiroContinuo) clearInterval(intervaloTiroContinuo);
    }
  }
  atualizarStatusUI();
}

// =====================================================
// ATIRAR
// =====================================================
function atirar() {
  if (jogo.gameOver || jogoVitoria || jogoPausado || !jogador.podeAtirar) return;
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
  setTimeout(() => jogador.podeAtirar = true, Math.max(jogo.cadencia, 120));
}

// =====================================================
// CHEFE
// =====================================================
function criarChefe() {
  jogo.chefeAtivo = true;
  jogo.chefe = {
    x: TELA_BASE_LARGURA / 2 - 75,
    y: -100,
    largura: 150,
    altura: 80,
    vida: 50 + jogo.fase * 10,
    vidaMax: 50 + jogo.fase * 10,
    direcao: 1,
    tempoMovimento: 0,
    tempoTiro: 0
  };
}

function desenharChefe() {
  if (!jogo.chefeAtivo || !jogo.chefe) return;
  const ch = jogo.chefe;
  
  ctx.fillStyle = '#cc2222';
  ctx.shadowBlur = 12;
  ctx.shadowColor = '#ff4444';
  ctx.fillRect(ch.x, ch.y, ch.largura, ch.altura);
  ctx.fillStyle = '#ffcc00';
  ctx.fillRect(ch.x + 15, ch.y + 15, 30, 30);
  ctx.fillRect(ch.x + ch.largura - 45, ch.y + 15, 30, 30);
  ctx.fillStyle = '#222';
  ctx.fillRect(ch.x + 50, ch.y + 45, 50, 15);
  ctx.shadowBlur = 0;
  
  const barLarg = 200;
  const barX = TELA_BASE_LARGURA / 2 - barLarg / 2;
  const barY = 15;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barLarg, 12);
  ctx.fillStyle = '#ff2222';
  ctx.fillRect(barX, barY, barLarg * (ch.vida / ch.vidaMax), 12);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barLarg, 12);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('CHEFE', TELA_BASE_LARGURA / 2, barY + 9);
}

// =====================================================
// CRIAR FASE — A CADA 5 = CHEFE
// =====================================================
function criarFase() {
  inimigos = [];
  tirosInimigos = [];
  
  // A cada 5 fases → CHEFE
  if (jogo.fase % 5 === 0) {
    if (!jogo.chefeAtivo) {
      criarChefe();
    }
    return;
  }

  // FASE NORMAL — INIMIGOS
  jogo.chefeAtivo = false;
  jogo.chefe = null;

  const linhas = 3 + Math.min(jogo.fase - 1, 4);
  const cols = 5 + Math.min(jogo.fase - 1, 4);
  const espX = 75, espY = 65, inicioX = 60, inicioY = 40;

  for (let l = 0; l < linhas; l++) {
    for (let c = 0; c < cols; c++) {
      const s = Math.random();
      let tipo;
      if (jogo.fase <= 2) {
        tipo = s < 0.7 ? TIPOS_INIMIGOS.FRACO : TIPOS_INIMIGOS.NORMAL;
      } else if (jogo.fase <= 4) {
        tipo = s < 0.45 ? TIPOS_INIMIGOS.FRACO :
               s < 0.8 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      } else {
        tipo = s < 0.25 ? TIPOS_INIMIGOS.FRACO :
               s < 0.55 ? TIPOS_INIMIGOS.NORMAL :
               s < 0.85 ? TIPOS_INIMIGOS.FORTE : TIPOS_INIMIGOS.CHEFE;
      }
      inimigos.push({
        x: inicioX + c * espX,
        y: inicioY + l * espY,
        largura: tipo.tamanho,
        altura: tipo.tamanho,
        vida: tipo.vidaMax,
        tipo: tipo,
        tempoMovimento: Math.random() * Math.PI * 2,
        velocidadeX: 0.5 + Math.random() * 1.5,
        velocidadeY: 0.3 + Math.random() * 0.5,
        tempoProximoTiro: Math.random() * 2000 + 1000,
        intervaloTiro: Math.max(1500 + Math.random() * 2000 - jogo.fase * 150, 600)
      });
    }
  }
}

// =====================================================
// ATUALIZAR PAINÉIS
// =====================================================
// =====================================================
// ATUALIZAR PAINÉIS — CORRIGIDO
// =====================================================
function atualizarStatusUI() {
  const elTiro = document.getElementById('status-tiro');
  if (elTiro) {
    elTiro.innerHTML = `
      <span style="color:${jogo.tipoTiroAtual.cor};font-weight:bold">${jogo.tipoTiroAtual.nome}</span>
      <div style="font-size:11px;margin-top:2px;">Nível: ${jogo.nivelPoder}/5 | Dano: ${jogo.danoPorTiro.toFixed(1)}x</div>
    `;
    // Forçar atualização imediata da cor
    elTiro.style.color = jogo.tipoTiroAtual.cor;
  }
  const elBombas = document.getElementById('qtd-bombas');
  if (elBombas) elBombas.textContent = jogo.bombas;
  const elEscudo = document.getElementById('status-escudo');
  if (elEscudo) {
    elEscudo.style.display = jogo.escudo ? 'block' : 'none';
    const elEscudoVidas = document.getElementById('escudo-vidas');
    if (elEscudoVidas && jogo.escudo) elEscudoVidas.textContent = jogo.escudo.vidas;
  }
  const elPontos = document.getElementById('pontos');
  if (elPontos) elPontos.textContent = jogo.pontos;
  const elVidas = document.getElementById('vidas');
  if (elVidas) elVidas.textContent = jogo.vidas;
  const elFase = document.getElementById('fase');
  if (elFase) elFase.textContent = jogo.fase;
}

// =====================================================
// TECLADO
// =====================================================
document.addEventListener('keydown', (e) => {
  teclas[e.key] = true;

  if (e.key === ' ') {
    e.preventDefault();
    iniciarAudio();

    if (jogo.gameOver) {
      reiniciarJogo();
      return;
    }

    if (jogoVitoria) {
      avancarParaProximaFase();
      return;
    }

    if (jogoPausado) {
      alternarPausa();
      return;
    }

    if (!segurandoEspaco) {
      segurandoEspaco = true;
      atirar();
      intervaloTiroTeclado = setInterval(() => {
        if (segurandoEspaco && !jogoPausado && !jogo.gameOver && !jogoVitoria) {
          atirar();
        }
      }, Math.max(jogo.cadencia, 120));
    }
  }

  if ((e.key === 'b' || e.key === 'B') && !jogoPausado && !jogo.gameOver && !jogoVitoria) {
    usarBomba();
  }

  if (e.key === 'Escape') {
    alternarPausa();
  }
});

document.addEventListener('keyup', (e) => {
  teclas[e.key] = false;
  if (e.key === ' ') {
    segurandoEspaco = false;
    if (intervaloTiroTeclado) {
      clearInterval(intervaloTiroTeclado);
      intervaloTiroTeclado = null;
    }
  }
});

// =====================================================
// LOOP PRINCIPAL
// =====================================================
function loop(tempoAtual) {
  const delta = tempoAtual - ultimoTempo;
  ultimoTempo = tempoAtual;
  tempoAcumulado += delta;

  // Fundo
  ctx.fillStyle = '#050b18';
  ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);

  // Estrelas
  estrelas.forEach(estrela => {
    estrela.y += estrela.velocidade;
    if (estrela.y > TELA_BASE_ALTURA) {
      estrela.y = -5;
      estrela.x = Math.random() * TELA_BASE_LARGURA;
    }
    ctx.fillStyle = estrela.cor;
    ctx.globalAlpha = estrela.brilho;
    ctx.beginPath();
    ctx.arc(estrela.x, estrela.y, estrela.tamanho, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;

  // Tela de Pausa
  if (jogoPausado && !jogo.gameOver && !jogoVitoria) {
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 42px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('⏸️ JOGO PAUSADO', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2);
    ctx.font = '20px Arial';
    ctx.fillText('Pressione ESPAÇO ou clique em Retomar', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 50);
    requestAnimationFrame(loop);
    return;
  }

  // Game Over
  if (jogo.gameOver) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('💀 GAME OVER', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 - 40);
    ctx.fillStyle = '#fff';
    ctx.font = '24px Arial';
    ctx.fillText(`Pontuação: ${jogo.pontos}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 10);
    ctx.fillText(`Fase alcançada: ${jogo.fase}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 45);
    ctx.fillStyle = '#ffcc00';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Pressione ESPAÇO para reiniciar', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 90);
    requestAnimationFrame(loop);
    return;
  }

  // =====================================================
  // 🏆 TELA DE MISSÃO CUMPRIDA — COM BOTÃO
  // =====================================================
  if (jogoVitoria) {
    const decorrido = Date.now() - tempoVitoria;
    const brilho = 0.7 + Math.sin(decorrido / 150) * 0.3;

    ctx.fillStyle = 'rgba(0, 20, 50, 0.90)';
    ctx.fillRect(0, 0, TELA_BASE_LARGURA, TELA_BASE_ALTURA);

    ctx.globalAlpha = brilho;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 52px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🏆 MISSÃO CUMPRIDA!', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 - 80);

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.fillText(`Pontuação: ${jogo.pontos}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 - 20);
    ctx.fillText(`Próxima Fase: ${jogo.fase + 1}`, TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 10);

    ctx.fillStyle = '#90ee90';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('Clique abaixo para continuar →', TELA_BASE_LARGURA / 2, TELA_BASE_ALTURA / 2 + 60);

    const btnX = TELA_BASE_LARGURA / 2 - 120;
    const btnY = TELA_BASE_ALTURA / 2 + 90;
    const btnLarg = 240;
    const btnAlt = 55;

    ctx.fillStyle = '#22aa22';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#33ff33';
    if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnLarg, btnAlt, 12);
    else ctx.fillRect(btnX, btnY, btnLarg, btnAlt);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px Arial';
    ctx.fillText('🚀 PRÓXIMA FASE', TELA_BASE_LARGURA / 2, btnY + 35);

    const cliqueHandler = function(e) {
      const rect = canvas.getBoundingClientRect();
      const escalaX = canvas.width / rect.width;
      const escalaY = canvas.height / rect.height;
      const clickX = (e.clientX - rect.left) * escalaX;
      const clickY = (e.clientY - rect.top) * escalaY;

      if (clickX >= btnX && clickX <= btnX + btnLarg &&
          clickY >= btnY && clickY <= btnY + btnAlt) {
        canvas.removeEventListener('click', cliqueHandler);
        avancarParaProximaFase();
      }
    };
    canvas.addEventListener('click', cliqueHandler);

    requestAnimationFrame(loop);
    return;
  }

  if (jogoPausado) {
    requestAnimationFrame(loop);
    return;
  }

  // Movimento do jogador
  if (teclas['ArrowLeft'] || teclas['a']) {
    jogador.x -= jogador.velocidade;
    if (jogador.x < 0) jogador.x = 0;
  }
  if (teclas['ArrowRight'] || teclas['d']) {
    jogador.x += jogador.velocidade;
    if (jogador.x + jogador.largura > TELA_BASE_LARGURA) {
      jogador.x = TELA_BASE_LARGURA - jogador.largura;
    }
  }

  // Movimento por toque
  if (toqueAtivo && areaMovimento) {
    const rect = areaMovimento.getBoundingClientRect();
    const centroX = rect.left + rect.width / 2;
    const maxDesloc = rect.width / 2 - 25;
    const desloc = (toqueAtivo.x - centroX) / maxDesloc;
    jogador.x += desloc * jogador.velocidade;
    jogador.x = Math.max(0, Math.min(TELA_BASE_LARGURA - jogador.largura, jogador.x));
  }

  // Atualizar tiros do jogador
    // Atualizar tiros do jogador
  jogador.tiros = jogador.tiros.filter(tiro => {
    switch (tiro.formato) {
      case 'trovao': // ⚡ NOVO
        tiro.y -= 11;
        // Zigue-zague leve do raio
        tiro.x += Math.sin(tempoAcumulado / 60 + tiro.y / 30) * 2.5;
        break;
      case 'espalhado':
        tiro.x += tiro.vx;
        tiro.y -= 9;
        break;
      case 'curvo':
        tiro.vx += Math.sin(tempoAcumulado / 150) * 0.15;
        tiro.x += tiro.vx;
        tiro.y -= 10;
        break;
      case 'explosivo':
        tiro.y -= 7;
        tiro.x += Math.sin(tempoAcumulado / 100) * 1.5;
        break;
      default:
        tiro.y -= 10;
    }
    return tiro.y > -20;
  });

  // Tiros inimigos
  tirosInimigos = tirosInimigos.filter(tiro => {
    tiro.y += 5;
    return tiro.y < TELA_BASE_ALTURA + 20;
  });

  // Atualizar inimigos
  inimigos.forEach(inf => {
    inf.tempoMovimento += delta / 1000;
    inf.x += Math.sin(inf.tempoMovimento * inf.velocidadeX) * 1.5;
    inf.y += inf.velocidadeY;

    if (inf.x < 0) inf.x = 0;
    if (inf.x + inf.largura > TELA_BASE_LARGURA) {
      inf.x = TELA_BASE_LARGURA - inf.largura;
    }

    inf.tempoProximoTiro -= delta;
    if (inf.tempoProximoTiro <= 0 && inf.y > 0) {
      tirosInimigos.push({
        x: inf.x + inf.largura / 2 - 2,
        y: inf.y + inf.altura,
        largura: 4,
        altura: 12,
        cor: '#ff4444'
      });
      inf.tempoProximoTiro = inf.intervaloTiro;
    }

    if (inf.y > TELA_BASE_ALTURA) {
      inf.y = -inf.altura;
      inf.x = Math.random() * (TELA_BASE_LARGURA - inf.largura);
    }
  });

  // Atualizar chefe
  if (jogo.chefeAtivo && jogo.chefe) {
    const ch = jogo.chefe;
    if (ch.y < 40) {
      ch.y += 1;
    } else {
      ch.tempoMovimento += delta / 1000;
      ch.x += Math.sin(ch.tempoMovimento * 1.2) * 3;
      ch.x = Math.max(0, Math.min(TELA_BASE_LARGURA - ch.largura, ch.x));

      ch.tempoTiro -= delta;
      if (ch.tempoTiro <= 0) {
        for (let i = 0; i < 3; i++) {
          tirosInimigos.push({
            x: ch.x + ch.largura / 2 - 2,
            y: ch.y + ch.altura,
            largura: 5,
            altura: 15,
            cor: '#ff0044'
          });
        }
        ch.tempoTiro = 800;
      }
    }
  }

  // Itens
  itensUpgrade = itensUpgrade.filter(item => {
    item.y += item.velocidade;
    return item.y < TELA_BASE_ALTURA + 40;
  });

  jogo.tempoProximoItem -= delta;
  if (jogo.tempoProximoItem <= 0) {
    criarItemUpgrade();
    jogo.tempoProximoItem = 4000 + Math.random() * 3000 - jogo.fase * 200;
  }

  // Explosões
  explosoes = explosoes.filter(exp => {
    exp.duracao--;
    exp.particulas.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.1;
      p.vx *= 0.98;
    });
    return exp.duracao > 0;
  });

  // ========== COLISÕES ==========

  // Tiro jogador vs inimigos
  jogador.tiros = jogador.tiros.filter(tiro => {
    let acertou = false;
    for (let i = inimigos.length - 1; i >= 0; i--) {
      const inf = inimigos[i];
      if (colide(tiro, inf)) {
        acertou = true;
        inf.vida -= tiro.dano;
        if (inf.vida <= 0) {
          criarExplosao(inf.x + inf.largura / 2, inf.y + inf.altura / 2, 1, inf.tipo.cor);
          somExplosao(1);
          jogo.pontos += inf.tipo.pontos * jogo.fase;
          inimigos.splice(i, 1);
          atualizarStatusUI();
        }
        break;
      }
    }

    // Tiro vs Chefe
    if (!acertou && jogo.chefeAtivo && jogo.chefe && colide(tiro, jogo.chefe)) {
      acertou = true;
      jogo.chefe.vida -= tiro.dano;
      if (jogo.chefe.vida <= 0) {
        criarExplosao(jogo.chefe.x + jogo.chefe.largura / 2, jogo.chefe.y + jogo.chefe.altura / 2, 2, '#ff0044');
        somExplosao(2);
        jogo.pontos += 500 * jogo.fase;

        // ✅ CHEFE DERROTADO → TELA DE VITÓRIA
        jogo.chefeAtivo = false;
        jogo.chefe = null;
        jogoVitoria = true;
        tempoVitoria = Date.now();

        atualizarStatusUI();
      }
    }
    return !acertou;
  });

  // Tiro inimigo vs jogador
  tirosInimigos = tirosInimigos.filter(tiro => {
    if (colide(tiro, jogador)) {
      receberDano(1);
      return false;
    }
    return true;
  });

  // Item vs jogador
  itensUpgrade = itensUpgrade.filter(item => {
    if (colideItem(jogador, item)) {
      coletarItemUpgrade(item);
      return false;
    }
    return true;
  });

  // Próxima fase — só quando NÃO há chefe ativo e NÃO está em vitória
  if (inimigos.length === 0 && !jogo.chefeAtivo && !jogoVitoria) {
    jogo.fase++;
    if (jogo.vidas < 3) {
      jogo.vidas++;
      jogo.vidaAtual = TIROS_POR_VIDA;
    }
    criarFase();
    atualizarStatusUI();
  }

  // ========== DESENHAR TUDO ==========
  jogador.tiros.forEach(desenharTiro);
  tirosInimigos.forEach(tiro => {
    ctx.fillStyle = tiro.cor;
    ctx.shadowBlur = 8;
    ctx.shadowColor = tiro.cor;
    ctx.fillRect(tiro.x, tiro.y, tiro.largura, tiro.altura);
    ctx.shadowBlur = 0;
  });
  inimigos.forEach(desenharInimigo);
  desenharChefe();
  itensUpgrade.forEach(desenharItemUpgrade);
  desenharJogador();

  explosoes.forEach(exp => {
    exp.particulas.forEach(p => {
      ctx.fillStyle = p.cor;
      ctx.globalAlpha = exp.duracao / 40;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  });

  requestAnimationFrame(loop);
}

// =====================================================
// INICIAR JOGO
// =====================================================
ajustarTela();
criarEstrelas();
criarPaineis();
criarFase();
atualizarStatusUI();
requestAnimationFrame(loop);
