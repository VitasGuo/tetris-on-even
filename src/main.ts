import { waitForEvenAppBridge, TextContainerProperty, ImageContainerProperty, CreateStartUpPageContainer, TextContainerUpgrade, ImageRawDataUpdate } from '@evenrealities/even_hub_sdk'

const BRIDGE = await waitForEvenAppBridge()

// Game constants
const BOARD_W = 100
const TOP_H = 120
const BOT_H = 120
const GAME_H = TOP_H + BOT_H

const PREVIEW = 56
let highScore = 0
const HS_KEY = 'tetris_hs'

// Shapes
const SHAPES = [
  [[1,1,1,1]], [[1,1],[1,1]], [[0,1,0],[1,1,1]],
  [[1,0,0],[1,1,1]], [[0,0,1],[1,1,1]],
  [[0,1,1],[1,1,0]], [[1,1,0],[0,1,1]]
]

// Score per lines: 1->10, 2->30, 3->50, 4->80
const LINE_SCORES = [0, 10, 30, 50, 80]

// Speed tiers: every 100 points = +1 tier
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
    // Update speed every 100 points
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

// Border constants
const B = 2
const CW = BOARD_W + B * 2

function renderGame(): { t: string, b: string } {
  // Top container
  const tc = document.createElement('canvas')
  tc.width = CW; tc.height = TOP_H + B
  const tCtx = tc.getContext('2d')!
  tCtx.clearRect(0, 0, CW, TOP_H + B)

  // Top border
  tCtx.fillStyle = '#ffffff'
  tCtx.fillRect(B, 0, BOARD_W, B)
  // Left border
  tCtx.fillRect(0, 0, B, TOP_H + B)
  // Right border
  tCtx.fillRect(B + BOARD_W, 0, B, TOP_H + B)

  // Game content - rows 0-11 (classic style: filled border + smaller inner block)
  tCtx.fillStyle = '#ffffff'
  for (let r = 0; r < 12; r++)
    for (let c = 0; c < 10; c++)
      if (g.board[r][c]) {
        const x = B + c*10, y = B + r*10
        // Outer filled border (10x10)
        tCtx.fillRect(x, y, 10, 10)
        // Clear middle to create gap (1px border, so clear 8x8 from x+1,y+1)
        tCtx.clearRect(x+1, y+1, 8, 8)
        // Inner smaller filled block (6x6 at x+2,y+2)
        tCtx.fillRect(x+2, y+2, 6, 6)
      }

  // Current piece - rows 0-11 (same classic style)
  if (g.cp && !g.over) {
    for (let r = 0; r < g.cp.shape.length; r++)
      for (let c = 0; c < g.cp.shape[r].length; c++)
        if (g.cp.shape[r][c]) {
          const px = B + (g.cp.x+c)*10
          const py = B + (g.cp.y + r) * 10
          if (py >= B && py < TOP_H + B) {
            // Outer filled border
            tCtx.fillRect(px, py, 10, 10)
            // Clear middle
            tCtx.clearRect(px+1, py+1, 8, 8)
            // Inner smaller block
            tCtx.fillRect(px+2, py+2, 6, 6)
          }
        }
  }

  // Bottom container
  const bc = document.createElement('canvas')
  bc.width = CW; bc.height = BOT_H
  const bCtx = bc.getContext('2d')!
  bCtx.clearRect(0, 0, CW, BOT_H)

  // Bottom hint line at y=80
  bCtx.fillStyle = '#888888'
  bCtx.fillRect(B, 80, BOARD_W, B)

  // Left border (only to hint line)
  bCtx.fillStyle = '#ffffff'
  bCtx.fillRect(0, 0, B, 82)
  // Right border (only to hint line)
  bCtx.fillRect(B + BOARD_W, 0, B, 82)

  // Game content - rows 12-19 (classic style)
  bCtx.fillStyle = '#ffffff'
  for (let r = 12; r < 20; r++)
    for (let c = 0; c < 10; c++)
      if (g.board[r][c]) {
        const x = B + c*10
        const y = (r-12)*10
        // Outer filled border
        bCtx.fillRect(x, y, 10, 10)
        // Clear middle
        bCtx.clearRect(x+1, y+1, 8, 8)
        // Inner smaller block
        bCtx.fillRect(x+2, y+2, 6, 6)
      }

  // Current piece - rows 12-19 (same classic style)
  if (g.cp && !g.over) {
    for (let r = 0; r < g.cp.shape.length; r++)
      for (let c = 0; c < g.cp.shape[r].length; c++)
        if (g.cp.shape[r][c]) {
          const px = B + (g.cp.x+c)*10
          const py = (g.cp.y + r) * 10 - 120
          if (py >= 0 && py < BOT_H) {
            // Outer filled border
            bCtx.fillRect(px, py, 10, 10)
            // Clear middle
            bCtx.clearRect(px+1, py+1, 8, 8)
            // Inner smaller block
            bCtx.fillRect(px+2, py+2, 6, 6)
          }
        }
  }

  return { t: tc.toDataURL('image/png').split(',')[1], b: bc.toDataURL('image/png').split(',')[1] }
}

function renderN(): string {
  const c = document.createElement('canvas')
  c.width = PREVIEW; c.height = PREVIEW
  const ctx = c.getContext('2d')!
  ctx.clearRect(0, 0, PREVIEW, PREVIEW)
  if (!g.np) return c.toDataURL('image/png').split(',')[1]
  const s = g.np.shape, bs = 10
  const ox = Math.floor((PREVIEW - s[0].length*bs)/2), oy = Math.floor((PREVIEW - s.length*bs)/2)
  ctx.fillStyle = '#ffffff'
  for (let r = 0; r < s.length; r++)
    for (let c2 = 0; c2 < s[r].length; c2++)
      if (s[r][c2]) {
        const x = ox + c2*bs, y = oy + r*bs
        // Outer filled border (10x10)
        ctx.fillRect(x, y, 10, 10)
        // Clear middle (8x8)
        ctx.clearRect(x+1, y+1, 8, 8)
        // Inner smaller block (6x6)
        ctx.fillRect(x+2, y+2, 6, 6)
      }
  return c.toDataURL('image/png').split(',')[1]
}

let loop: number | null = null

function start() {
  g.board = Array.from({ length: 20 }, () => Array(10).fill(0))
  g.score = 0; g.speedIdx = 0; g.lines = 0; g.over = false; g.paused = false
  g.dropI = SPEED_TIERS[0].interval; g.last = Date.now()
  g.np = mkPiece(); g.cp = g.np; g.np = mkPiece()
  if (loop) clearInterval(loop)
  loop = setInterval(upd, 50) as unknown as number
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

  try {
    const ni = renderN()
    await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 4, containerName: 'next', imageData: ni }))
  } catch(e) { console.error('Next render failed:', e) }

  // Speed display
  const speedPct = SPEED_TIERS[g.speedIdx].pct
  const txt = g.over ? 'GAME OVER\nD-Click Rst' : g.paused ? 'PAUSED\nClick Res' :
    `Speed:${speedPct}%\n\n^ Slide: Left\nv Slide: Right\nClick: Rotate\nD-Click: Pause`

  try {
    await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
      containerID: 5, containerName: 'info', content: txt, contentOffset: 0, contentLength: 0
    }))
  } catch(e) { console.error('Info update failed:', e) }

  // Left panel: current score + best score
  try {
    await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
      containerID: 10, containerName: 'sc', content: `${g.score}`, contentOffset: 0, contentLength: 0
    }))
  } catch(e) { console.error('Score update failed:', e) }

  try {
    await BRIDGE.textContainerUpgrade(new TextContainerUpgrade({
      containerID: 7, containerName: 'hs', content: `${highScore}`, contentOffset: 0, contentLength: 0
    }))
  } catch(e) { console.error('HS update failed:', e) }
}

// 3-column layout
const COL = 192
const CW_FULL = CW
const GX = COL + Math.floor((COL - CW_FULL) / 2)
const GY = Math.floor((288 - GAME_H) / 2) + 10

// Left column
const LX = COL - 100
const NY = GY
const SCORE_Y = NY + 24 + PREVIEW + 16
const BEST_Y = SCORE_Y + 24 + 36

// Right column
const RX = COL * 2 + 10
const IY = GY

// Containers
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

// Left panel
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

// Right panel - with mobile hint
const info = new TextContainerProperty({
  xPosition: RX, yPosition: IY,
  width: 170, height: 200, borderWidth: 0, borderColor: 0, paddingLength: 2,
  containerID: 5, containerName: 'info',
  content: `Speed:100%\n\n^ Slide: Left\nv Slide: Right\nClick: Rotate\nD-Click: Pause\n\nPhone: OK`,
  isEventCapture: 0,
})

loadHS()

const res = await BRIDGE.createStartUpPageContainer(new CreateStartUpPageContainer({
  containerTotalNum: 10,
  textObject: [evt, nl, sl, sc, hl, hsd, info],
  imageObject: [gt, gb, nd],
}))

if (res === 0) {
  const et = document.createElement('canvas')
  et.width = CW; et.height = TOP_H + B
  const eb = document.createElement('canvas')
  eb.width = CW; eb.height = BOT_H

  await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 2, containerName: 'gt', imageData: et.toDataURL('image/png').split(',')[1] }))
  await BRIDGE.updateImageRawData(new ImageRawDataUpdate({ containerID: 3, containerName: 'gb', imageData: eb.toDataURL('image/png').split(',')[1] }))

  BRIDGE.onEvenHubEvent(async (event) => {
    // Log all events for debugging (including phone input)
    if (event.sysEvent) {
      const t = event.sysEvent.eventType ?? 0
      const src = event.sysEvent.eventSource
      console.log(`Event: sysEvent type=${t}, source=${src}`)
      
      if (t === 3) { if (g.over) start(); else toggleP(); return }
      if (t === 0) { if (g.over) return; if (g.paused) toggleP(); else doR(); return }
    }
    if (event.textEvent) {
      const t = event.textEvent.eventType ?? 0
      const src = event.textEvent.eventSource
      console.log(`Event: textEvent type=${t}, source=${src}`)
      
      if (t === 1) moveL()
      else if (t === 2) moveR()
    }
  })

  start()
  console.log('Tetris ready - score-based speed!')
} else {
  console.error('Init failed:', res)
}
