import gitCommitInfo from 'git-commit-info';
import packageJson from './package.json';

// When built in GitHub Actions, the commit hash is available in the environment, and gitCommitInfo won't find it.
const commitHash = gitCommitInfo().shortHash ?? process.env.COMMIT_HASH;

const { version } = packageJson;

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@nuxt/image', '@nuxtjs/i18n', '@vite-pwa/nuxt', '@nuxt/ui'],
  pwa: {},
  nitro: {
    prerender: {
      crawlLinks: true,
    },
  },
  build: {},
  vite: {},
  runtimeConfig: {
    public: {
      commitHash,
      version,
      buildDate: new Date().toISOString(),
    },
  },
});
