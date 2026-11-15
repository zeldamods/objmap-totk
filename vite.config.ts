import { execSync } from 'node:child_process';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

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
    vue(),
  ],
  envPrefix: 'VUE_APP_',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
