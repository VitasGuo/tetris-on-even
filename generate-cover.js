const { createCanvas } = require('canvas')
const fs = require('fs')

// 创建512x512的封面图
const canvas = createCanvas(512, 512)
const ctx = canvas.getContext('2d')

// 背景 - 黑色
ctx.fillStyle = '#000000'
ctx.fillRect(0, 0, 512, 512)

// 绘制方块图案（装饰）
ctx.fillStyle = '#00ff00' // 绿色（G2眼镜显示）
const blockSize = 20
const blocks = [
  [2, 5], [3, 5], [4, 5], [5, 5],  // I shape
  [2, 8], [3, 8], [2, 9], [3, 9],  // O shape
  [4, 12], [5, 12], [3, 13], [4, 13], [5, 13],  // T shape
]

blocks.forEach(([x, y]) => {
  // 外框
  ctx.fillRect(x*blockSize, y*blockSize, blockSize, blockSize)
  // 内部小方块
  ctx.fillStyle = '#000000'
  ctx.fillRect(x*blockSize+2, y*blockSize+2, blockSize-4, blockSize-4)
  ctx.fillStyle = '#00ff00'
  ctx.fillRect(x*blockSize+4, y*blockSize+4, blockSize-8, blockSize-8)
})

// 绘制文字 "TETRIS"
ctx.font = 'bold 48px monospace'
ctx.fillStyle = '#00ff00'
ctx.textAlign = 'center'
ctx.fillText('TETRIS', 256, 300)

// 绘制 "on Even"
ctx.font = '24px monospace'
ctx.fillText('on Even', 256, 340)

// 绘制戒指图标（简单表示）
ctx.beginPath()
ctx.arc(256, 400, 30, 0, Math.PI * 2)
ctx.strokeStyle = '#00ff00'
ctx.lineWidth = 3
ctx.stroke()

ctx.font = '16px monospace'
ctx.fillText('Ring Control', 256, 430)

// 保存为PNG
const buffer = canvas.toBuffer('image/png')
fs.writeFileSync('cover.png', buffer)
console.log('Cover image generated: cover.png (512x512)')
