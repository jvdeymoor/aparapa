import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { randomUUID } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { newGame, act, endTurn } from './src/game/engine.js';

const PORT = Number(process.env.PORT || 3000);
const MONGODB_URI = process.env.MONGODB_URI;
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'https://aparapa.com,https://www.aparapa.com').split(',').map(value => value.trim());
const CONFIG = { RULES:{ CORE_INTEGRITY:20, STARTING_HAND:5, DECK_SIZE:40, MAX_HAND:8, MOVES_PER_TURN:2, START_ENERGY:3, START_MAX_ENERGY:3, ENERGY_EVERY_TURNS:3, ABSOLUTE_MAX_ENERGY:7, BRISCOLE_EVERY_ROUNDS:5, DOMINION_THRESHOLD:10, DOMINION_TURNS_TO_WIN:3, MAX_MAGIFICATE:2, DRAW_PER_TURN:1 } };
const memory = new Map();
let collection;

async function initStore() {
  if (!MONGODB_URI) return console.warn('MONGODB_URI assente: archivio memoria temporaneo, non adatto alla release.');
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  collection = client.db().collection('briscola_games');
  await collection.createIndex({ code: 1 }, { unique: true });
}
async function load(code) { return collection ? collection.findOne({ code }) : memory.get(code); }
async function save(game) { if (collection) await collection.replaceOne({ code: game.code }, game, { upsert: true }); else memory.set(game.code, game); }
function code() { return randomUUID().replaceAll('-', '').slice(0, 6).toUpperCase(); }
function token() { return randomUUID(); }
function json(res, status, body) { res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store' }); res.end(JSON.stringify(body)); }
async function body(req) { let raw=''; for await (const part of req) raw += part; return raw ? JSON.parse(raw) : {}; }
function playerOf(game, accessToken) { return game.tokens.findIndex(value => value === accessToken); }
function publicState(game, player) {
  if (!game.state) return { code:game.code, joined:false, player, waiting:true };
  const state = structuredClone(game.state);
  state.players.forEach((p, index) => { if (index !== player) { p.hand = p.hand.map(() => 'hidden'); p.deck = Array(p.deck.length).fill('hidden'); } });
  return { code:game.code, joined:!!game.tokens[1], player, state };
}
const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml', '.glb':'model/gltf-binary' };
async function staticFile(req, res) {
  const path = normalize(join(process.cwd(), decodeURIComponent(new URL(req.url, 'http://local').pathname === '/' ? '/index.html' : new URL(req.url, 'http://local').pathname)));
  if (!path.startsWith(process.cwd())) return json(res, 403, { error:'Percorso non consentito' });
  try { if (!(await stat(path)).isFile()) throw Error(); res.writeHead(200, { 'content-type':mime[extname(path)] || 'application/octet-stream' }); res.end(await readFile(path)); } catch { json(res, 404, { error:'File non trovato' }); }
}
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.includes(origin)) { res.setHeader('access-control-allow-origin', origin); res.setHeader('vary', 'Origin'); }
  if (req.method === 'OPTIONS') { res.writeHead(204, { 'access-control-allow-methods':'GET,POST,OPTIONS', 'access-control-allow-headers':'content-type,authorization' }); return res.end(); }
  try {
    const url = new URL(req.url, `http://${req.headers.host}`), parts = url.pathname.split('/').filter(Boolean);
    if (req.method === 'POST' && url.pathname === '/api/games') {
      const input = await body(req), game = { code:code(), tokens:[token(), null], deckCounts:[input.deckCounts, null], state:null, createdAt:new Date(), updatedAt:new Date() };
      await save(game); return json(res, 201, { code:game.code, accessToken:game.tokens[0], player:0 });
    }
    if (req.method === 'POST' && parts[0] === 'api' && parts[1] === 'games' && parts[3] === 'join') {
      const game = await load(parts[2]); if (!game) return json(res, 404, { error:'Partita non trovata' });
      if (game.tokens[1]) return json(res, 409, { error:'Partita già completa' });
      const input = await body(req); game.tokens[1] = token(); game.deckCounts[1] = input.deckCounts; game.state = newGame(CONFIG, Date.now(), game.deckCounts); game.updatedAt = new Date(); await save(game); return json(res, 200, { code:game.code, accessToken:game.tokens[1], player:1 });
    }
    if (parts[0] === 'api' && parts[1] === 'games' && parts[2]) {
      const game = await load(parts[2]); if (!game) return json(res, 404, { error:'Partita non trovata' });
      const player = playerOf(game, req.headers.authorization?.replace('Bearer ', '')); if (player < 0) return json(res, 401, { error:'Accesso non valido' });
      if (req.method === 'GET') return json(res, 200, publicState(game, player));
      if (req.method === 'POST' && parts[3] === 'action') {
        if (!game.tokens[1] || !game.state) return json(res, 409, { error:'In attesa del secondo giocatore' });
        if (game.state.active !== player) return json(res, 409, { error:'Non è il tuo turno' });
        const input = await body(req); game.state = act(game.state, CONFIG, input.action); game.updatedAt = new Date(); await save(game); return json(res, 200, publicState(game, player));
      }
      if (req.method === 'POST' && parts[3] === 'end-turn') {
        if (!game.tokens[1] || !game.state) return json(res, 409, { error:'In attesa del secondo giocatore' });
        if (game.state.active !== player) return json(res, 409, { error:'Non è il tuo turno' });
        game.state = endTurn(game.state, CONFIG); game.updatedAt = new Date(); await save(game); return json(res, 200, publicState(game, player));
      }
    }
    return staticFile(req, res);
  } catch (error) { console.error(error); json(res, 400, { error:error.message || 'Richiesta non valida' }); }
});
await initStore();
server.listen(PORT, '0.0.0.0', () => console.log(`BRISCOLA MAGICATA multiplayer su :${PORT}`));
