import { NextIntlClientProvider, hasLocale } from 'next-intl'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { Navbar } from '@/components/Navbar'
import { SpeedInsights } from '@vercel/speed-insights/next' 

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  const isRtl = locale === 'ar'

  return (
    <NextIntlClientProvider>
      <div lang={locale} dir={isRtl ? 'rtl' : 'ltr'}>
        <Navbar />
        {children}
         <SpeedInsights /> 
      </div>
    </NextIntlClientProvider>
  )
}