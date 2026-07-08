import { copyFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function createSpaFallback(distDir = 'dist') {
  await copyFile(join(distDir, 'index.html'), join(distDir, '404.html'))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await createSpaFallback(process.argv[2] ?? 'dist')
}
