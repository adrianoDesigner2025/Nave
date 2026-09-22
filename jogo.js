@@ -1,22 +1,20 @@
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
@@ -30,7 +28,6 @@
    <div id="status-escudo" style="margin-top:8px;display:none;">🛡️ Escudo: <span id="escudo-vidas">3</span>/3</div>
  `;
  document.body.appendChild(painelUpgrade);

  const painelStatus = document.createElement('div');
  painelStatus.id = 'painel-status';
  painelStatus.innerHTML = `
@@ -40,13 +37,11 @@
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
@@ -61,7 +56,6 @@
    configurarControlesMovel();
  }
}

// =====================================================
// SISTEMA DE PAUSA
// =====================================================
@@ -86,7 +80,6 @@
    }
  }
}

// =====================================================
// CONTROLES DE TOQUE — MÓVEL
// =====================================================
@@ -95,13 +88,11 @@
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
@@ -126,12 +117,11 @@
      });
    });
  }

  if (botaoAtirar) {
    botaoAtirar.addEventListener('touchstart', (e) => {
      e.preventDefault();
      iniciarAudio();
      if (jogo.gameOver) {
      if (jogo.gameOver || jogoVitoria) {
        reiniciarJogo();
        return;
      }
@@ -156,15 +146,13 @@
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
@@ -177,7 +165,6 @@
  teclas['ArrowRight'] = fator > 0.1;
  alavanca.style.transform = `translate(calc(-50% + ${deslocX}px), -50%)`;
}

// =====================================================
// ÁUDIO E MÚSICA
// =====================================================
@@ -189,7 +176,6 @@
} catch(e) {
  console.log('⚠️ Arquivo de música não encontrado');
}

let contextoAudio = null;
function iniciarAudio() {
  if (!contextoAudio) {
@@ -200,7 +186,6 @@
    musicaFundo.play().catch(() => {});
  }
}

function somTiro(tipo = 'AMARELO') {
  if (!contextoAudio) return;
  const som = contextoAudio.createOscillator();
@@ -284,7 +269,6 @@
      break;
  }
}

function somExplosao(tamanho = 1) {
  if (!contextoAudio) return;
  const som = contextoAudio.createOscillator();
@@ -299,7 +283,6 @@
  som.start(contextoAudio.currentTime);
  som.stop(contextoAudio.currentTime + 0.4 * tamanho);
}

function somColetarCoracao() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
@@ -315,7 +298,6 @@
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.4);
}

function somColetarBomba() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
@@ -330,7 +312,6 @@
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.25);
}

function somColetarEscudo() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
@@ -345,7 +326,6 @@
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.35);
}

function somColetarTiro() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
@@ -360,7 +340,6 @@
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.2);
}

function somSubirNivel() {
  if (!contextoAudio) return;
  const o = contextoAudio.createOscillator();
@@ -376,7 +355,6 @@
  o.start(contextoAudio.currentTime);
  o.stop(contextoAudio.currentTime + 0.3);
}

// =====================================================
// TELA RESPONSIVA
// =====================================================
@@ -397,18 +375,15 @@
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
@@ -427,7 +402,6 @@
    });
  }
}

// =====================================================
// TIPOS DO JOGO
// =====================================================
@@ -438,18 +412,15 @@
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
@@ -462,64 +433,25 @@
  escudo: null, bombas: 0,
  chefeAtivo: false, chefe: null, avisoChefeMostrado: false
};

// =====================================================
// VITÓRIA — MISSÃO CUMPRIDA
// VITÓRIA — JOGO FINALIZADO
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
// REMOVIDO: avancarParaProximaFase — NÃO AVANÇA MAIS
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
@@ -536,7 +468,6 @@
    clearInterval(intervaloTiroContinuo);
    intervaloTiroContinuo = null;
  }

  jogo = {
    pontos: 0, 
    vidas: 3, 
@@ -554,26 +485,21 @@
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
@@ -582,7 +508,6 @@
  somTiro('ESCUDO');
  atualizarStatusUI();
}

function escudoReceberDano() {
  if (!jogo.escudo) return false;
  jogo.escudo.vidas--;
@@ -591,7 +516,6 @@
  atualizarStatusUI();
  return true;
}

function desenharEscudo() {
  if (!jogo.escudo) return;
  const cx = jogador.x + jogador.largura / 2;
@@ -619,7 +543,6 @@
  ctx.stroke();
  ctx.restore();
}

// =====================================================
// SISTEMA DE BOMBAS
// =====================================================
@@ -629,7 +552,6 @@
    atualizarStatusUI();
  }
}

function usarBomba() {
  if (jogo.bombas <= 0 || jogoPausado || jogo.gameOver || jogoVitoria) return;
  jogo.bombas--;
@@ -644,7 +566,6 @@
  tirosInimigos = [];
  atualizarStatusUI();
}

// =====================================================
// EXPLOSÕES
// =====================================================
@@ -667,11 +588,10 @@
// =====================================================
// ⚡ CORRENTE ELÉTRICA — TROVÃO EM CADEIA
// =====================================================
const raiosAtivos = [];
function criarCorrenteElétrica(origemX, origemY, alvo, dano) {
  // Aplica dano no alvo
  alvo.vida -= dano;

  // Registra o raio visual
  raiosAtivos.push({
    x1: origemX,
    y1: origemY,
@@ -681,17 +601,15 @@
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
  const alcanceCadeia = 180;
  const maxAlvos = 3;
  let alvosAtingidos = 1;

  for (let i = 0; i < inimigos.length && alvosAtingidos < maxAlvos; i++) {
@@ -708,13 +626,12 @@
        alvo.x + alvo.largura / 2,
        alvo.y + alvo.altura / 2,
        candidato,
        dano * 0.7 // Dano reduz na cadeia
        dano * 0.7
      );
      alvosAtingidos++;
    }
  }
}

// =====================================================
// ITENS DE UPGRADE
// =====================================================
@@ -737,7 +654,6 @@
    piscar: 0
  });
}

function coletarItemUpgrade(item) {
  if (item.tipo.ehBomba) {
    coletarBomba();
@@ -768,9 +684,8 @@
    jogo.cadencia = 280;
    somColetarTiro();
  }
  atualizarStatusUI(); // ✅ Sempre atualiza, inclusive na mudança de tipo
  atualizarStatusUI();
}

// =====================================================
// DESENHAR JOGADOR — INCLINAÇÃO CORRIGIDA
// =====================================================
@@ -786,16 +701,12 @@
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
@@ -838,7 +749,6 @@
  ctx.fillRect(x, y, lrg * pct, alt);
  ctx.shadowBlur = 0;
}

function desenharInimigo(inf) {
  const tipo = inf.tipo;
  const tamanho = tipo.tamanho;
@@ -874,26 +784,23 @@
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
    ctx.fillRect(tiro.x + 1, tiro.y, 2, 18);
    ctx.fillStyle = tiro.cor;
    ctx.fillRect(tiro.x - 1, tiro.y, 6, 18); // Corpo do raio
    ctx.fillRect(tiro.x - 1, tiro.y, 6, 18);
    ctx.fillStyle = '#aaddff';
    ctx.fillRect(tiro.x, tiro.y + 3, 4, 12); // Brilho interno
    ctx.fillRect(tiro.x, tiro.y + 3, 4, 12);
  } else {
    ctx.fillStyle = tiro.cor;
    ctx.fillRect(tiro.x, tiro.y, 4, 15);
  }
  ctx.shadowBlur = 0;
}

function desenharItemUpgrade(item) {
  item.piscar += 0.15;
  const brilho = 0.7 + Math.sin(item.piscar) * 0.3;
@@ -954,20 +861,17 @@
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
@@ -996,7 +900,6 @@
  }
  atualizarStatusUI();
}

// =====================================================
// ATIRAR
// =====================================================
@@ -1019,7 +922,6 @@
  jogador.podeAtirar = false;
  setTimeout(() => jogador.podeAtirar = true, Math.max(jogo.cadencia, 120));
}

// =====================================================
// CHEFE
// =====================================================
@@ -1037,547 +939,42 @@
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
    if (!jogo.chefeAtivo || !jogo.chefe) return;
    
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
    
    // Corpo principal do chefe
    ctx.fillStyle = '#cc2222';
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#ff4444';
    ctx.fillRect(ch.x, ch.y, ch.largura, ch.altura);
    
    // Olho esquerdo
    ctx.fillStyle = '#ffcc00';
    ctx.fillRect(ch.x + 15, ch.y + 15, 30, 30);
    
    // Olho direito (trecho que estava incompleto)
    ctx.fillRect(ch.x + ch.largura - 45, ch.y + 15, 30, 30);
    
    // Boca / detalhe facial
    ctx.fillStyle = '#ff6600';
    ctx.fillRect(ch.x + ch.largura / 2 - 25, ch.y + ch.altura - 45, 50, 12);
    
    // Barra de vida do chefe
    const larguraBarra = ch.largura;
    const alturaBarra = 10;
    const porcentagemVida = ch.vida / ch.vidaMax;
    
    // Fundo da barra
    ctx.fillStyle = '#333333';
    ctx.fillRect(ch.x, ch.y - 20, larguraBarra, alturaBarra);
    
    // Vida atual
    ctx.fillStyle = porcentagemVida > 0.3 ? '#00ff00' : '#ff0000';
    ctx.fillRect(ch.x, ch.y - 20, larguraBarra * porcentagemVida, alturaBarra);
    
    // Reset da sombra para não afetar outros elementos
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
    ctx.shadowColor = 'transparent';
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
