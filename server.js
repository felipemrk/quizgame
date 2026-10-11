// FamilyQuiz — servidor. Rode com:  npm start
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const express = require('express');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const { Jogo } = require('./src/jogo');

const PORTA = Number(process.env.PORT) || 3000;

const app = express();
const servidor = http.createServer(app);
const io = new Server(servidor, { pingInterval: 5000, pingTimeout: 8000 });
const jogo = new Jogo(io);

const PUBLICO = path.join(__dirname, 'public');
app.use(express.static(PUBLICO, { extensions: ['html'] }));
app.get('/', (req, res) => res.redirect('/tv'));
app.get('/tv', (req, res) => res.sendFile(path.join(PUBLICO, 'tv.html')));
app.get('/jogar', (req, res) => res.sendFile(path.join(PUBLICO, 'jogar.html')));
app.get('/qr', async (req, res) => {
  try {
    const svg = await QRCode.toString(String(req.query.u || ''), { type: 'svg', margin: 1, color: { dark: '#14102b', light: '#ffffff' } });
    res.type('image/svg+xml').send(svg);
  } catch { res.status(400).end(); }
});

// ---------- endereço na rede de casa ----------
function ipLocal() {
  const candidatos = [];
  for (const [nome, ifs] of Object.entries(os.networkInterfaces())) {
    for (const i of ifs || []) {
      if (i.family !== 'IPv4' || i.internal) continue;
      const virtual = /vethernet|virtualbox|vmware|wsl|docker|hyper-v|loopback|tailscale|zerotier|vpn/i.test(nome);
      const privado = /^(192\.168\.|10\.|172\.(1[6-9]|2\d|3[01])\.)/.test(i.address);
      candidatos.push({ ip: i.address, nota: (privado ? 2 : 0) + (virtual ? -3 : 0) + (i.address.startsWith('192.168.') ? 1 : 0) });
    }
  }
  candidatos.sort((a, b) => b.nota - a.nota);
  return candidatos.length ? candidatos[0].ip : 'localhost';
}
jogo.rede.urlLocal = `http://${ipLocal()}:${PORTA}/jogar`;

// ---------- partida online (Cloudflare Tunnel, link temporário) ----------
let tunel = null;
async function ligarTunel() {
  if (tunel) return;
  jogo.rede.tunel = 'ligando';
  jogo.rede.erroTunel = '';
  jogo.transmitir();
  try {
    const cf = require('cloudflared');
    if (!fs.existsSync(cf.bin)) {
      console.log('Baixando o cloudflared (só na primeira vez)...');
      await cf.install(cf.bin);
    }
    tunel = cf.Tunnel.quick(`http://localhost:${PORTA}`);
    const desistir = setTimeout(() => falhaTunel('O link demorou demais para ficar pronto. Tente de novo.'), 45000);
    tunel.once('url', url => {
      clearTimeout(desistir);
      jogo.rede.urlOnline = `${url}/jogar`;
      jogo.rede.tunel = 'ligado';
      console.log(`🌍 Link online: ${jogo.rede.urlOnline}`);
      jogo.transmitir();
    });
    tunel.on('error', e => falhaTunel(e.message));
    tunel.on('exit', () => { if (jogo.rede.tunel !== 'desligado') falhaTunel('O túnel foi encerrado.'); });
  } catch (e) {
    falhaTunel(e.message);
  }
}
function falhaTunel(msg) {
  console.warn('Túnel:', msg);
  desligarTunel();
  jogo.rede.tunel = 'erro';
  jogo.rede.erroTunel = 'Não consegui criar o link online. Verifique a internet e tente de novo.';
  jogo.transmitir();
}
function desligarTunel() {
  if (tunel) { try { tunel.stop(); } catch {} }
  tunel = null;
  jogo.rede.urlOnline = '';
  jogo.rede.tunel = 'desligado';
}

// ---------- conexões ----------
io.on('connection', socket => {
  // Tela principal
  socket.on('tv:entrar', () => { socket.join('tv'); jogo.transmitir(); });
  socket.on('tv:categoria', id => jogo.alternarCategoria(id));
  socket.on('tv:dificuldade', modo => jogo.definirDificuldade(modo));
  socket.on('tv:remover', id => jogo.removerJogador(id));
  socket.on('tv:iniciar', () => jogo.iniciar());
  socket.on('tv:novaPartida', () => jogo.novaPartida());
  socket.on('tv:zerarHistorico', (_, ack) => { jogo.zerarHistorico(); if (typeof ack === 'function') ack(true); });
  socket.on('tv:recarregar', () => { if (jogo.fase === 'saguao') { jogo.recarregarPerguntas(); jogo.transmitir(); } });
  socket.on('tv:modo', modo => {
    if (jogo.fase !== 'saguao' && modo === 'local') return;   // não derruba o link no meio da partida
    jogo.rede.modo = modo === 'online' ? 'online' : 'local';
    if (jogo.rede.modo === 'online') ligarTunel(); else desligarTunel();
    jogo.transmitir();
  });

  // Controles
  const responder = (ack, r) => { if (typeof ack === 'function') ack(r); };
  socket.on('jogador:verificar', (id, ack) => responder(ack, jogo.podeRetomar(id)));
  socket.on('jogador:entrar', (dados, ack) => responder(ack, jogo.entrar(socket, dados || {})));
  socket.on('jogador:retomar', (id, ack) => responder(ack, jogo.retomar(socket, id)));
  socket.on('votar', id => jogo.votar(socket, id));
  socket.on('usarPoder', d => jogo.usarPoder(socket, d || {}));
  socket.on('responder', i => jogo.responder(socket, i));
  socket.on('escolherFinal', id => jogo.escolherCategoriaFinal(socket, id));

  socket.on('disconnect', () => jogo.desconectar(socket));
});

servidor.listen(PORTA, () => {
  const total = jogo.categorias.reduce((s, c) => s + c.perguntas.length, 0);
  console.log('');
  console.log('  🎮  FamilyQuiz rodando!');
  console.log(`  📺  Tela principal:  http://localhost:${PORTA}/tv`);
  console.log(`  📱  Controles:       ${jogo.rede.urlLocal}`);
  console.log(`  ❓  ${total} perguntas em ${jogo.categorias.length} categorias`);
  console.log('  Para encerrar, feche esta janela (ou Ctrl+C).');
  console.log('');
  if (process.argv.includes('--abrir')) abrirNavegador(`http://localhost:${PORTA}/tv`);
});

function abrirNavegador(url) {
  const { exec } = require('child_process');
  const cmd = process.platform === 'win32' ? `start "" "${url}"` : process.platform === 'darwin' ? `open "${url}"` : `xdg-open "${url}"`;
  exec(cmd, () => {});
}

process.on('SIGINT', () => { desligarTunel(); process.exit(0); });
process.on('exit', () => desligarTunel());
