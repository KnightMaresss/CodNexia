import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'ar', 'de', 'fr', 'ru'],
  defaultLocale: 'en',
  localePrefix: 'always'
})