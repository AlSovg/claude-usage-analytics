// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/i18n'],
  css: ['~/assets/css/main.css'],
  components: [
    { path: '~/components/analytics', pathPrefix: false }
  ],
  i18n: {
    defaultLocale: 'ru',
    strategy: 'no_prefix',
    locales: [
      { code: 'ru', language: 'ru-RU', name: 'RU', file: 'ru.json' },
      { code: 'en', language: 'en-US', name: 'EN', file: 'en.json' }
    ],
    detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_locale', fallbackLocale: 'ru' }
  }
})
