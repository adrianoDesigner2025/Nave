// =====================================================
// CONFIGURAÇÕES BASE
// =====================================================
const TELA_BASE_LARGURA = 800;
const TELA_BASE_ALTURA = 600;
const MAX_FILAS = 6;
const FASES_PARA_CHEFE = 5;

const canvas = document.getElementById('tela');
const ctx = canvas.getContext('2d');

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
  FORTE: {vidaMax:4, cor:'#ff6600', pontos:50, tamanho:44}
};
const TIPO_ITEM_BOMBA = {ehBomba:true, cor:'#ff3300', nome:'Bomba'};
const TIPO_ITEM_CORACAO = {ehCoracao:true, cor:'#ff3366', nome:'Vida Completa'};
const TIPO_ITEM_ESCUDO = {ehEscudo:true, cor:'#00ccff', nome:'Escudo'};

// =====================================================
// VARIÁVEIS GLOBAIS
// =====================================================
const TIROS_POR_VIDA = 5;
let jogo = {
  pontos:0, vidas:3, vidaAtual:TIROS_POR_VIDA,
  fase:1, gameOver:false,
  tipoTiroAtual:TIPOS_TIRO.AMARELO, nivelPoder:1, danoPorTiro:1,
  cadencia:280,
  escudo:null, bombas:0,
  chefeAtivo:false, chefe:null
};
let jogoVitoria = false;
let teclas = {};
const jogador = {
  x:TELA_BASE_LARGURA/2-25, y:TELA_BASE_ALTURA-80,
  largura:50, altura:50, velocidade:7,
  tiros:[], podeAtirar:true
};
let inimigos = [], tirosInimigos = [], explosoes = [], itensUpgrade = [];
let ultimoTempo = 0;

// =====================================================
// AUXILIARES
// =====================================================
function colide(a,b) {
  return a.x < (b.x||0)+(b.largura||0) && a.x+(a.largura||4) > (b.x||0) &&
         a.y < (b.y||0)+(b.altura||0) && a.y+(a.altura||15) > (b.y||0);
}
function atualizarStatusUI() {
  const elPontos = document.getElementById('pontos');
  const elVidas = document.getElementById('vidas');
  const elFase = document.getElementById('fase');
  const elBombas = document.getElementById('qtd-bombas');
  if(elPontos) elPontos.textContent = jogo.pontos;
  if(elVidas) elVidas.textContent = jogo.vidas;
  if(elFase) elFase.textContent = jogo.fase;
  if(elBombas) elBombas.textContent = jogo.bombas;
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
function somExplosao() {}

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
    tempoTiro: 0, direcao: 1
  };
}
function chefeReceberDano(dano) {
  if(!jogo.chefe) return;
  jogo.chefe.vida -= dano;
  if(jogo.chefe.vida <= 0) {
    criarExplosao(jogo.chefe.x+75, jogo.chefe.y+40, 2, '#ff4444');
    jogo.pontos += 300 * jogo.fase;
    jogo.chefeAtivo = false;
    jogo.chefe = null;
    jogo.fase++;
    criarFase();
    atualizarStatusUI();
  }
}
function atualizarChefe(delta) {
  if(!jogo.chefeAtivo || !jogo.chefe) return;
  const ch = jogo.chefe;
  if(ch.y < 40) { ch.y += 0.8; return; }
  ch.x += ch.direcao * 1.2;
  if(ch.x <= 20 || ch.x+ch.largura >= TELA_BASE_LARGURA-20) ch.direcao *= -1;
  ch.tempoTiro += delta;
  if(ch.tempoTiro > 1200) {
    ch.tempoTiro = 0;
    const qtd = 2 + Math.floor(jogo.fase/FASES_PARA_CHEFE);
    for(let i=0;i<qtd;i++) {
      const desv = (i-(qtd-1)/2)*40;
      tirosInimigos.push({
        x:ch.x+75+desv, y:ch.y+80, largura:4, altura:12,
        velocidade:4+jogo.fase*0.2, cor:'#ff4444'
      });
    }
  }
}
function desenharChefe() {
  if(!jogo.chefe) return;
  const ch = jogo.chefe;
  ctx.fillStyle='#cc2222'; ctx.shadowBlur=12; ctx.shadowColor='#ff4444';
  ctx.fillRect(ch.x, ch.y, ch.largura, ch.altura);
  ctx.fillStyle='#ffcc00';
  ctx.fillRect(ch.x+15, ch.y+15, 30, 30);
  ctx.fillRect(ch.x+ch.largura-45, ch.y+15, 30, 30);
  ctx.fillStyle='#222'; ctx.fillRect(ch.x+50, ch.y+45, 50, 15);
  const pct = ch.vida/ch.vidaMax;
  ctx.fillStyle='#333'; ctx.fillRect(300,15,200,12);
  ctx.fillStyle='#ff2222'; ctx.fillRect(300,15,200*pct,12);
  ctx.fillStyle='#fff'; ctx.font='bold 11px Arial';
  ctx.fillText('👑 CHEFE', 400, 24);
  ctx.shadowBlur=0;
}

// =====================================================
// CRIAR FASE
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
  for(let l=0; l<filas; l++) {
    for(let c=0; c<cols; c++) {
      let tipo;
      const r = Math.random();
      if(jogo.fase <= 2) tipo = r<0.7 ? TIPOS_INIMIGOS.FRACO : TIPOS_INIMIGOS.NORMAL;
      else if(jogo.fase <= 4) tipo = r<0.4 ? TIPOS_INIMIGOS.FRACO : r<0.8 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      else tipo = r<0.2 ? TIPOS_INIMIGOS.FRACO : r<0.6 ? TIPOS_INIMIGOS.NORMAL : TIPOS_INIMIGOS.FORTE;
      inimigos.push({
        x:40+c*75, y:40+l*65,
        largura:tipo.tamanho, altura:tipo.tamanho,
        vida:tipo.vidaMax+Math.floor(jogo.fase/3), tipo, direcao:1
      });
    }
  }
}

// =====================================================
// TIROS DO JOGADOR — COMPLETO E FECHADO
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
          for(let k = inimigos.length - 1; k >= 0; k--) {
            if(k === j) continue;
            const outro = inimigos[k];
            const dist = Math.hypot(outro.x+outro.largura/2 - t.x, outro.y+outro.altura/2 - t.y);
            if(dist < 60) {
              outro.vida -= t.dano * 0.5;
              if(outro.vida <= 0) {
                criarExplosao(outro.x+outro.largura/2, outro.y+outro.altura/2, 0.8, outro.tipo.cor);
                jogo.pontos += outro.tipo.pontos * jogo.fase;
                inimigos.splice(k,1);
              }
            }
          }
        }

        if(inf.vida <= 0) {
          criarExplosao(inf.x+inf.largura/2, inf.y+inf.altura/2, 1, inf.tipo.cor);
          jogo.pontos += inf.tipo.pontos * jogo.fase;
          inimigos.splice(j,1);
          if(Math.random() < 0.15) itensUpgrade.push({
            x:inf.x, y:-30, largura:26, altura:26,
            velocidade:2+Math.random()*1.5,
            tipo:[TIPO_ITEM_BOMBA,TIPO_ITEM_CORACAO,TIPO_ITEM_ESCUDO][Math.floor(Math.random()*3)]
          });
        }
        break;
      }
    }

    if(!acertou && jogo.chefeAtivo && jogo.chefe && colide(t, jogo.chefe)) {
      acertou = true;
      chefeReceberDano(t.dano);
    }

    if(acertou) jogador.tiros.splice(i,1);
  }
}

// =====================================================
// RESTANTE DO JOGO
// =====================================================
function atualizarInimigos(delta) {
  if(inimigos.length === 0 && !jogo.chefeAtivo && !jogo.gameOver) {
    jogo.fase++;
    criarFase();
    return;
  }
  const vel = 0.4 + jogo.fase*0.06;
  let bateu = false;
  for(const inf of inimigos) {
    inf.x += vel * inf.direcao;
    if(inf.x <= 10 || inf.x+inf.largura >= TELA_BASE_LARGURA-10) bateu = true;
  }
  if(bateu) {
    for(const inf of inimigos) {
      inf.direcao *= -1;
      inf.y += 18;
      if(inf.y+inf.altura >= jogador.y) jogo.gameOver = true;
    }
  }
  if(Math.random() < delta/Math.max(1200, 3000-jogo.fase*180) && inimigos.length>0) {
    const alvo = inimigos[Math.floor(Math.random()*inimigos.length)];
    tirosInimigos.push({x:alvo.x+alvo.largura/2-2, y:alvo.y+alvo.altura, largura:4, altura:12, velocidade:3+jogo.fase*0.15, cor:alvo.tipo.cor});
  }
}
function atualizarTirosInimigos() {
  for(let i=tirosInimigos.length-1; i>=0; i--) {
    const t = tirosInimigos[i];
    t.y += t.velocidade;
    if(t.y > TELA_BASE_ALTURA) { tirosInimigos.splice(i,1); continue; }
    if(colide(t, jogador)) {
      tirosInimigos.splice(i,1);
      jogo.vidaAtual--;
      if(jogo.vidaAtual<=0) { jogo.vidas--; jogo.vidaAtual=TIROS_POR_VIDA; }
      if(jogo.vidas<=0) jogo.gameOver=true;
      atualizarStatusUI();
    }
  }
}
function atualizarItens() {
  for(let i=itensUpgrade.length-1; i>=0; i--) {
    const item = itensUpgrade[i];
    item.y += item.velocidade;
    if(item.y > TELA_BASE_ALTURA) { itensUpgrade.splice(i,1); continue; }
    if(colide(item, jogador)) {
      if(item.tipo.ehBomba && jogo.bombas<3) jogo.bombas++;
      if(item.tipo.ehCoracao) { jogo.vidas=3; jogo.vidaAtual=TIROS_POR_VIDA; }
      if(item.tipo.ehEscudo) jogo.escudo = {vidas:3};
      itensUpgrade.splice(i,1);
      atualizarStatusUI();
    }
  }
}
function atualizarExplosoes() {
  for(let i=explosoes.length-1; i>=0; i--) {
    const e = explosoes[i];
    e.duracao--;
    for(const p of e.particulas) {
      p.x += p.vx; p.y += p.vy; p.vida -= 0.03;
    }
    if(e.duracao <= 0) explosoes.splice(i,1);
  }
}
function atirar() {
  if(jogo.gameOver || !jogador.podeAtirar) return;
  const qtd = jogo.nivelPoder;
  for(let i=0;i<qtd;i++) {
    const desl = (i-(qtd-1)/2)*12;
    jogador.tiros.push({
      x:jogador.x+25-2+desl, y:jogador.y, vx:0,
      cor:jogo.tipoTiroAtual.cor, formato:jogo.tipoTiroAtual.formato,
      dano:jogo.danoPorTiro
    });
  }
  jogador.podeAtirar = false;
  setTimeout(()=>jogador.podeAtirar=true, Math.max(jogo.cadencia,120));
}

// =====================================================
// DESENHO
// =====================================================
function desenhar() {
  ctx.fillStyle='#050b18'; ctx.fillRect(0,0,TELA_BASE_LARGURA,TELA_BASE_ALTURA);
  ctx.fillStyle='#fff';
  ctx.fillRect(jogador.x+22, jogador.y, 6, 15);
  for(const t of jogador.tiros) {
    ctx.fillStyle=t.cor; ctx.fillRect(t.x, t.y, 4, 15);
  }
  for(const t of tirosInimigos) {
    ctx.fillStyle=t.cor; ctx.fillRect(t.x, t.y, 4, 12);
  }
  for(const inf of inimigos) {
    ctx.fillStyle=inf.tipo.cor;
    ctx.fillRect(inf.x, inf.y, inf.largura, inf.altura);
  }
  desenharChefe();
  for(const item of itensUpgrade) {
    ctx.fillStyle=item.tipo.cor;
    ctx.fillRect(item.x, item.y, item.largura, item.altura);
  }
  for(const e of explosoes) {
    for(const p of e.particulas) {
      ctx.globalAlpha = p.vida;
      ctx.fillStyle = p.cor;
      ctx.fillRect(p.x, p.y, p.tamanho, p.tamanho);
    }
    ctx.globalAlpha = 1;
  }
  if(jogo.gameOver) {
    ctx.fillStyle='rgba(0,0,0,0.75)'; ctx.fillRect(0,0,800,600);
    ctx.fillStyle='#fff'; ctx.font='bold 36px Arial'; ctx.textAlign='center';
    ctx.fillText('FIM DE JOGO', 400, 280);
    ctx.font='20px Arial';
    ctx.fillText(`Pontos: ${jogo.pontos}`, 400, 320);
    ctx.fillText('Pressione ENTER para reiniciar', 400, 360);
  }
}

// =====================================================
// LOOP PRINCIPAL
// =====================================================
function loop(timestamp) {
  const delta = timestamp - ultimoTempo;
  ultimoTempo = timestamp;

  if(!jogo.gameOver) {
    if(teclas['ArrowLeft'] || teclas['a']) jogador.x = Math.max(0, jogador.x - jogador.velocidade);
    if(teclas['ArrowRight'] || teclas['d']) jogador.x = Math.min(TELA_BASE_LARGURA-jogador.largura, jogador.x + jogador.velocidade);
    atualizarTiros(delta);
    atualizarInimigos(delta);
    atualizarChefe(delta);
    atualizarTirosInimigos();
    atualizarItens();
    atualizarExplosoes();
  }
  desenhar();
  requestAnimationFrame(loop);
}

// =====================================================
// TECLADO
// =====================================================
document.addEventListener('keydown', e => {
  teclas[e.key] = true;
  if(e.key === ' ') { e.preventDefault(); atirar(); }
  if(e.key === 'Enter' && jogo.gameOver) {
    jogo = {pontos:0, vidas:3, vidaAtual:TIROS_POR_VIDA, fase:1, gameOver:false, tipoTiroAtual:TIPOS_TIRO.AMARELO, nivelPoder:1, danoPorTiro:1, cadencia:280, escudo:null, bombas:0, chefeAtivo:false, chefe:null};
    jogador.x=375; jogador.y=520; jogador.tiros=[];
    inimigos=[]; tirosInimigos=[]; explosoes=[]; itensUpgrade=[];
    criarFase(); atualizarStatusUI();
  }
});
document.addEventListener('keyup', e => { teclas[e.key] = false; });

// =====================================================
// INICIAR
// =====================================================
canvas.width = TELA_BASE_LARGURA;
canvas.height = TELA_BASE_ALTURA;
criarFase();
atualizarStatusUI();
requestAnimationFrame(loop);
