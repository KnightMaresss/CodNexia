import "./globals.css"
import { ToastContainer } from "@/components/ui/toast"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/components/auth-context'



export const metadata = {
  metadataBase: new URL('https://codnexia.com'),

  title: 'Codnexia',
  description:
    'Premium websites, mobile apps, AI automation, UI/UX design, and technical solutions for modern businesses.',

  openGraph: {
    title: 'Codnexia',
    description:
      'Premium websites, mobile apps, AI automation, UI/UX design, and technical solutions for modern businesses.',
    url: 'https://codnexia.com',
    siteName: 'Codnexia',
    images: [
      {
        url: '/og-banner-v2.png',
        width: 1200,
        height: 630,
        alt: 'Codnexia',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'Codnexia',
    description:
      'Premium websites, mobile apps, AI automation, UI/UX design, and technical solutions for modern businesses.',
    images: ['/og-banner-v2.png'],
  },
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
<html
  lang="en"
  className="h-full antialiased"
  suppressHydrationWarning
>
 <head>
    {/* ← ADD THIS LINE BELOW */}
 <meta name="google-site-verification" content="lemor0FHV43OzpC6iWzgWbeDl3Ktta8jU8gCnaVycYI" />
 <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
<link rel="shortcut icon" href="/favicon.ico?v=2" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png?v=2" />
      </head>
           <body className="min-h-full flex flex-col bg-background text-foreground transition-colors">
        <ThemeProvider>
  <AuthProvider>
    {children}
    <ToastContainer />
  </AuthProvider>
</ThemeProvider>
      </body>
    </html>
    
  )
}