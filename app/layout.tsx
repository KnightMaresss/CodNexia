import type { Metadata } from "next"
import "./globals.css"
import { ToastContainer } from "@/components/ui/toast"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from '@/components/auth-context'
import { Navbar } from '@/components/Navbar'


export const metadata: Metadata = {
  metadataBase: new URL('https://codnexia.com'),
  title: {
    default: 'Codnexia | Academic Help & Web Development',
    template: '%s | Codnexia',
  },
  description: 'Expert assistance for graduation projects, reports, websites, and apps. High-quality work delivered on time by Codnexia.',
  keywords: ['academic help', 'graduation projects', 'web development', 'Codnexia', 'thesis help'],
  authors: [{ name: 'Codnexia' }],
 icons: {
    icon: '/favicon-cx.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'Codnexia',
    title: 'Codnexia | Academic Help & Web Development',
    description: 'Expert assistance for graduation projects, reports, websites, and apps.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Codnexia | Academic Help & Web Development',
    description: 'Expert assistance for graduation projects, reports, websites, and apps.',
  },
  robots: {
    index: true,
    follow: true,
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
        <link rel="icon" href="/favicon-cx.png" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
           <body className="min-h-full flex flex-col bg-background text-foreground transition-colors">
        <ThemeProvider>
  <AuthProvider>
    <Navbar />
    {children}
    <ToastContainer />
  </AuthProvider>
</ThemeProvider>
        {/* Start of Tawk.to Script */}
        <script
          type="text/javascript"
          dangerouslySetInnerHTML={{
            __html: `
              var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
              (function(){
              var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
              s1.async=true;
              s1.src='https://embed.tawk.to/69f8bfc7b8b47f1c3485e472/1jnpqq8lj';
              s1.charset='UTF-8';
              s1.setAttribute('crossorigin','*');
              s0.parentNode.insertBefore(s1,s0);
              })();
            `,
          }}
        />
        {/* End of Tawk.to Script */}
      </body>
    </html>
    
  )
}