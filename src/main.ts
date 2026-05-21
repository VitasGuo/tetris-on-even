import { waitForEvenAppBridge, TextContainerProperty, ImageContainerProperty, CreateStartUpPageContainer, TextContainerUpgrade, ImageRawDataUpdate, OsEventTypeList } from '@evenrealities/even_hub_sdk'

const BRIDGE = await waitForEvenAppBridge()

const BOARD_W = 100
const TOP_H = 120
const BOT_H = 120
const GAME_H = TOP_H + BOT_H

const PREVIEW = 56
let highScore = 0
const HS_KEY = 'tetris_hs'

const SHAPES = [
  [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]],
  [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]]
]

const LINE_SCORES = [0, 10, 30, 50, 80]

const SPEED_TIERS = [
  { pct: 100, interval: 500 },
  { pct: 120, interval: 417 },
  { pct: 150, interval: 333 },
  { pct: 200, interval: 250 },
  { pct: 250, interval: 200 },
  { pct: 300, interval: 167 },
  { pct: 400, interval: 125 },
  { pct: 500, interval: 100 },
  { pct: 1000, interval: 50 },
  { pct: 1500, interval: 33 }
]

interface Piece { shape: number[][]; x: number; y: number }
interface GS {
  board: number[][]; cp: Piece | null; np: Piece | null
  score: number; speedIdx: number; lines: number
  over: boolean; paused: boolean; dropI: number; last: number
}

const g: GS = {
  board: Array.from({ length: 20 }, () => Array(10).fill(0)),
  cp: null, np: null, score: 0, speedIdx: 0, lines: 0,
  over: false, paused: false, dropI: 1000, last: Date.now()
}

function mkPiece(): Piece {
  const i = Math.floor(Math.random() * SHAPES.length)
  return { shape: SHAPES[i], x: Math.floor((10 - SHAPES[i][0].length) / 2), y: 0 }
}

function rot(s: number[][]): number[][] {
  const r = s.length, c = s[0].length
  const n = Array.from({ length: c }, () => Array(r).fill(0))
  for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) n[j][r-1-i] = s[i][j]
  return n
}

function valid(s: number[][], x: number, y: number): boolean {
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) {
        const nx = x + c, ny = y + r
        if (nx < 0 || nx >= 10 || ny >= 20) return false
        if (ny >= 0 && g.board[ny][nx]) return false
      }
  return true
}

function place() {
  const p = g.cp; if (!p) return
  for (let r = 0; r < p.shape.length; r++)
    for (let c = 0; c < p.shape[r].length; c++)
      if (p.shape[r][c] && p.y + r >= 0) g.board[p.y+r][p.x+c] = 1
  clr()
  g.cp = g.np; g.np = mkPiece()
  dirty.next = true
  if (g.cp && !valid(g.cp.shape, g.cp.x, g.cp.y)) g.over = true
}

function clr() {
  let c = 0
  for (let r = 19; r >= 0; r--)
    if (g.board[r].every(v => v)) { g.board.splice(r,1); g.board.unshift(Array(10).fill(0)); c++; r++ }
  if (c) {
    g.lines += c
    g.score += LINE_SCORES[c] || 0
    if (g.score > highScore) { highScore = g.score; saveHS() }
    const newIdx = Math.min(Math.floor(g.score / 100), SPEED_TIERS.length - 1)
    if (newIdx !== g.speedIdx) {
      g.speedIdx = newIdx
      g.dropI = SPEED_TIERS[g.speedIdx].interval
    }
  }
}

function moveL() { if (g.cp && !g.over && !g.paused && valid(g.cp.shape, g.cp.x-1, g.cp.y)) g.cp.x-- }
function moveR() { if (g.cp && !g.over && !g.paused && valid(g.cp.shape, g.cp.x+1, g.cp.y)) g.cp.x++ }
function doR() { if (g.cp && !g.over && !g.paused) { const r = rot(g.cp.shape); if (valid(r, g.cp.x, g.cp.y)) g.cp.shape = r } }
function toggleP() { g.paused = !g.paused }

function loadHS() { try { const s = localStorage.getItem(HS_KEY); if (s) highScore = parseInt(s) || 0 } catch(e) {} }
function saveHS() { try { localStorage.setItem(HS_KEY, highScore.toString()) } catch(e) {} }

const B = 2
const CW = BOARD_W + B * 2

const topCanvas = document.createElement('canvas')
topCanvas.width = CW; topCanvas.height = TOP_H + B
const topCtx = topCanvas.getContext('2d')!

const botCanvas = document.createElement('canvas')
botCanvas.width = CW; botCanvas.height = BOT_H
const botCtx = botCanvas.getContext('2d')!

const nextCanvas = document.createElement('canvas')
nextCanvas.width = PREVIEW; nextCanvas.height = PREVIEW
const nextCtx = nextCanvas.getContext('2d')!

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillRect(x, y, 10, 10)
  ctx.clearRect(x+1, y+1, 8, 8)
  ctx.fillRect(x+2, y+2, 6, 6)
}

function renderGame(): { t: string, b: string } {
  topCtx.clearRect(0, 0, CW, TOP_H + B)

  topCtx.fillStyle = '#ffffff'
  topCtx.fillRect(B, 0, BOARD_W, B)
  topCtx.fillRect(0, 0, B, TOP_H + B)
  topCtx.fillRect(B + BOARD_W, 0, B, TOP_H + B)

  topCtx.fillStyle = '#ffffff'
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 10; c++)
      if (g.board[r][c]) drawBlock(topCtx, B + c*10, B + r*10)

  if (g.cp && !g.over) {
    for (let r = 0; r < g.cp.shape.length; r++)
      for (let c = 0; c < g.cp.shape[r].length; c++)
        if (g.cp.shape[r][c]) {
          const px = B + (g.cp.x+c)*10
          const py = B + (g.cp.y + r) * 10
          if (py >= B && py < TOP_H + B) drawBlock(topCtx, px, py)
        }
  }

  botCtx.clearRect(0, 0, CW, BOT_H)

  botCtx.fillStyle = '#888888'
  botCtx.fillRect(B, 80, BOARD_W, B)

  botCtx.fillStyle = '#ffffff'
  botCtx.fillRect(0, 0, B, 82)
  botCtx.fillRect(B + BOARD_W, 0, B, 82)

  botCtx.fillStyle = '#ffffff'
  for (let r = 12; r < 20; r++)
    for (let c = 0; c < 10; c++)
      if (g.board[r][c]) drawBlock(botCtx, B + c*10, (r-12)*10)

  if (g.cp && !g.over) {
    for (let r = 0; r < g.cp.shape.length; r++)
      for (let c = 0; c < g.cp.shape[r].length; c++)
        if (g.cp.shape[r][c]) {
          const px = B + (g.cp.x+c)*10
          const py = (g.cp.y + r) * 10 - 120
          if (py >= 0 && py < BOT_H) drawBlock(botCtx, px, py)
        }
  }

  return { t: topCanvas.toDataURL('image/png').split(',')[1], b: botCanvas.toDataURL('image/png').split(',')[1] }
}

function renderN(): string {
  nextCtx.clearRect(0, 0, PREVIEW, PREVIEW)
  if (!g.np) return nextCanvas.toDataURL('image/png').split(',')[1]
  const s = g.np.shape, bs = 10
  const ox = Math.floor((PREVIEW - s[0].length*bs)/2), oy = Math.floor((PREVIEW - s.length*bs)/2)
  nextCtx.fillStyle = '#ffffff'
  for (let r = 0; r < s.length; r++)
    for (let c = 0; c < s[r].length; c++)
      if (s[r][c]) drawBlock(nextCtx, ox + c*bs, oy + r*bs)
  return nextCanvas.toDataURL('image/png').split(',')[1]
}

const dirty = { score: true, hs: true, info: true, next: true }
let prevScore = -1
let prevHs = -1
let prevInfo = ''

let loopTimer: ReturnType<typeof setTimeout> | null = null
let running = false

function start() {
  g.board = Array.from({ length: 20 }, () => Array(10).fill(0))
  g.score = 0; g.speedIdx = 0; g.lines = 0; g.over = false; g.paused = false
  g.dropI = SPEED_TIERS[0].interval; g.last = Date.now()
  g.np = mkPiece(); g.cp = g.np; g.np = mkPiece()
  prevScore = -1; prevHs = -1; prevInfo = ''
  dirty.score = true; dirty.hs = true; dirty.info = true; dirty.next = true
  if (loopTimer) { clearTimeout(loopTimer); loopTimer = null }
  running = true
  scheduleNext()
}

function scheduleNext() {
  if (!running) return
  loopTimer = setTimeout(async () => {
    await upd()
    scheduleNext()
  }, 100)
}

async function upd() {
  if (g.over || g.paused) { await ren(); return }
  const now = Date.now()
  if (now - g.last > g.dropI) {
    if (g.cp && valid(g.cp.shape, g.cp.x, g.cp.y+1)) g.cp.y++
    else if (g.cp) place()
    g.last = now
  }
  await ren()
}

async function ren() {
  try {
    const { t, b } = renderGame()
    await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 2, containerName: 'gt', imageData: t }))
    await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 3, containerName: 'gb', imageData: b }))
  } catch(e) { console.error('Game render failed:', e) }

  if (dirty.next) {
    dirty.next = false
    try {
      const ni = renderN()
      await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 4, containerName: 'next', imageData: ni }))
    } catch(e) { console.error('Next render failed:', e) }
  }

  const speedPct = SPEED_TIERS[g.speedIdx].pct
  const txt = g.over ? 'GAME OVER\nD-Click Rst' : g.paused ? 'PAUSED\nClick Res' :
    `Speed:${speedPct}%\n\n^ Slide: Left\nv Slide: Right\nClick: Rotate\nD-Click: Pause`

  if (txt !== prevInfo) {
    prevInfo = txt
    try {
      await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
        containerID: 5, containerName: 'info', content: txt, contentOffset: 0, contentLength: 0
      }))
    } catch(e) { console.error('Info update failed:', e) }
  }

  if (g.score !== prevScore) {
    prevScore = g.score
    try {
      await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
        containerID: 10, containerName: 'sc', content: `${g.score}`, contentOffset: 0, contentLength: 0
      }))
    } catch(e) { console.error('Score update failed:', e) }
  }

  if (highScore !== prevHs) {
    prevHs = highScore
    try {
      await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
        containerID: 7, containerName: 'hs', content: `${highScore}`, contentOffset: 0, contentLength: 0
      }))
    } catch(e) { console.error('HS update failed:', e) }
  }
}

const COL = 192
const CW_FULL = CW
const GX = COL + Math.floor((COL - CW_FULL) / 2)
const GY = Math.floor((288 - GAME_H) / 2) + 10

const LX = COL - 100
const NY = GY
const SCORE_Y = NY + 24 + PREVIEW + 16
const BEST_Y = SCORE_Y + 24 + 36

const RX = COL * 2 + 10
const IY = GY

const evt = new TextContainerProperty({
  xPosition: 0, yPosition: 0, width: 576, height: 288,
  borderWidth: 0, borderColor: 0, paddingLength: 0,
  containerID: 1, containerName: 'evt', content: ' ', isEventCapture: 1,
})

const gt = new ImageContainerProperty({
  xPosition: GX, yPosition: GY,
  width: CW, height: TOP_H + B,
  containerID: 2, containerName: 'gt',
})

const gb = new ImageContainerProperty({
  xPosition: GX, yPosition: GY + TOP_H + B,
  width: CW, height: BOT_H,
  containerID: 3, containerName: 'gb',
})

const nl = new TextContainerProperty({
  xPosition: LX, yPosition: NY,
  width: 100, height: 24, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 6, containerName: 'nl', content: 'NEXT', isEventCapture: 0,
})

const nd = new ImageContainerProperty({
  xPosition: LX + 22, yPosition: NY + 26,
  width: PREVIEW, height: PREVIEW,
  containerID: 4, containerName: 'next',
})

const sl = new TextContainerProperty({
  xPosition: LX, yPosition: SCORE_Y,
  width: 100, height: 24, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 9, containerName: 'sl', content: 'SCORE', isEventCapture: 0,
})

const sc = new TextContainerProperty({
  xPosition: LX, yPosition: SCORE_Y + 26,
  width: 100, height: 36, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 10, containerName: 'sc', content: '0', isEventCapture: 0,
})

const hl = new TextContainerProperty({
  xPosition: LX, yPosition: BEST_Y,
  width: 100, height: 24, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 8, containerName: 'hl', content: 'BEST', isEventCapture: 0,
})

const hsd = new TextContainerProperty({
  xPosition: LX, yPosition: BEST_Y + 26,
  width: 100, height: 36, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 7, containerName: 'hs', content: '0', isEventCapture: 0,
})

const info = new TextContainerProperty({
  xPosition: RX, yPosition: IY,
  width: 170, height: 200, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 5, containerName: 'info',
  content: `Speed:100%\n\n^ Slide: Left\nv Slide: Right\nClick: Rotate\nD-Click: Pause`,
  isEventCapture: 0,
})

loadHS()

const res = await BRIDGE.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 10,
  textObject: [evt, nl, sl, sc, hl, hsd, info],
  imageObject: [gt, gb, nd],
}))

if (res === 0) {
  topCtx.clearRect(0, 0, CW, TOP_H + B)
  botCtx.clearRect(0, 0, CW, BOT_H)

  await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 2, containerName: 'gt', imageData: topCanvas.toDataURL('image/png').split(',')[1] }))
  await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 3, containerName: 'gb', imageData: botCanvas.toDataURL('image/png').split(',')[1] }))

  BRIDGE.onEvenHubEvent((event) => {
    if (event.sysEvent) {
      const t = event.sysEvent.eventType ?? 0

      if (t === OsEventTypeList.DOUBLE_CLICK_EVENT) {
        if (g.over) start(); else toggleP()
        return
      }
      if (t === OsEventTypeList.CLICK_EVENT) {
        if (g.over) return
        if (g.paused) toggleP(); else doR()
        return
      }
      if (t === OsEventTypeList.FOREGROUND_ENTER_EVENT) {
        if (!running) start()
        return
      }
      if (t === OsEventTypeList.FOREGROUND_EXIT_EVENT) {
        if (running && !g.over) { g.paused = true }
        return
      }
    }
    if (event.textEvent) {
      const t = event.textEvent.eventType ?? 0

      if (t === OsEventTypeList.SCROLL_TOP_EVENT) moveL()
      else if (t === OsEventTypeList.SCROLL_BOTTOM_EVENT) moveR()
    }
  })

  start()
  console.log('Tetris ready')
} else {
  console.error('Init failed:', res)
}
