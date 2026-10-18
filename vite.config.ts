import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, Plugin } from 'vite';
import vue from '@vitejs/plugin-vue';
const execSync = require('child_process').execSync

// Vite cannot exclude part of publicDir, and public/game_files is often a
// symlink to ~300 MB of game data that the app loads from VUE_APP_GAME_FILES.
function copyPublicDirExceptGameFiles(): Plugin {
  let publicDir = '';
  let outDir = '';
  return {
    name: 'copy-public-dir-except-game-files',
    apply: 'build',
    configResolved(config) {
      publicDir = config.publicDir;
      outDir = path.resolve(config.root, config.build.outDir);
    },
    writeBundle() {
      const gameFiles = path.join(publicDir, 'game_files');
      fs.cpSync(publicDir, outDir, { recursive: true, filter: src => src !== gameFiles });
    },
  };
}

function git_hash() {
  let gitHash = '???'
  try {
    gitHash = execSync('git rev-parse --short HEAD').toString().trim()
  } catch (e) {
    console.warn('Git is not installed or this is not a git repository.')
  }
  return gitHash
}

process.env.VUE_APP_GIT_HASH = git_hash()

export default defineConfig({
  plugins: [
    // Match Vue CLI's whitespace handling: the templates rely on spaces between elements being dropped.
    vue(),
    copyPublicDirExceptGameFiles(),
  ],
  envPrefix: 'VUE_APP_',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    copyPublicDir: false,
  },
});
