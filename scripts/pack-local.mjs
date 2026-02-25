import { execFileSync } from 'node:child_process'
import { mkdirSync, readdirSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'

const rootDir = process.cwd()
const artifactDir = resolve(rootDir, '.artifacts')
const cacheDir = resolve(rootDir, '.npm-cache')
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'

mkdirSync(artifactDir, { recursive: true })
for (const entry of readdirSync(artifactDir)) {
  if (!entry.endsWith('.tgz')) continue
  rmSync(resolve(artifactDir, entry), { force: true })
}

execFileSync(npmCommand, ['run', 'build:lib'], {
  cwd: rootDir,
  stdio: 'inherit',
})

const packOutput = execFileSync(
  npmCommand,
  ['pack', '--json', '--pack-destination', artifactDir, '--cache', cacheDir],
  {
    cwd: rootDir,
    encoding: 'utf8',
  }
)

const parsed = JSON.parse(packOutput)
if (!Array.isArray(parsed) || parsed.length === 0 || typeof parsed[0]?.filename !== 'string') {
  throw new Error('Unable to determine tarball filename from npm pack output.')
}

const tarballPath = resolve(artifactDir, parsed[0].filename)

console.log(`\nLocal package ready:`)
console.log(tarballPath)
console.log('\nInstall in another project with:')
console.log(`npm install "${tarballPath}"`)
