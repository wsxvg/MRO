// Generate PNG PWA icons from source image
// Usage: node scripts/generate-pwa-icons.mjs
// Source: image.png in project root (copy your logo there first)

import sharp from 'sharp'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Source image is in the MRO project root (two levels up from scripts/)
const sourceFile = resolve(__dirname, '../../image.png')
const outDir = resolve(__dirname, '../public/icons')

const sizes = [
  { name: 'icon-192x192.png', size: 192 },
  { name: 'icon-512x512.png', size: 512 },
  // iOS apple-touch-icon sizes
  { name: 'icon-180x180.png', size: 180 },  // iPhone Retina
  { name: 'icon-152x152.png', size: 152 },  // iPad
  { name: 'icon-167x167.png', size: 167 },  // iPad Pro
]

async function generate() {
  for (const { name, size } of sizes) {
    const outPath = resolve(outDir, name)
    await sharp(sourceFile)
      .resize(size, size, { fit: 'cover', position: 'center' })
      .png()
      .toFile(outPath)
    console.log(`✓ Generated ${name} (${size}x${size})`)
  }
}

generate().catch(err => {
  console.error('Failed to generate icons:', err)
  process.exit(1)
})
