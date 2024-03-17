import gitCommitInfo from 'git-commit-info';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@nuxt/ui',
  ],
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
      commitHash: gitCommitInfo().shortHash,
      buildDate: new Date().toISOString(),
    },
  },
});
