import gitCommitInfo from 'git-commit-info';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: [
    '@nuxt/image',
    '@nuxtjs/i18n',
    '@vite-pwa/nuxt',
    '@nuxtjs/tailwindcss',
  ],
  pwa: {},
  nitro: {
    prerender: {
      crawlLinks: true,
    },
  },
  build: {
    transpile:
      process.env.NODE_ENV === 'production'
        ? [
            'naive-ui',
            'vueuc',
            '@css-render/vue3-ssr',
            '@juggle/resize-observer',
          ]
        : ['@juggle/resize-observer'],
  },
  vite: {
    optimizeDeps: {
      include:
        process.env.NODE_ENV === 'development'
          ? ['naive-ui', 'vueuc', 'date-fns-tz/esm/formatInTimeZone']
          : [],
    },
  },
  runtimeConfig: {
    public: {
      commitHash: gitCommitInfo().shortHash,
      buildDate: new Date().toISOString(),
    },
  },
});
