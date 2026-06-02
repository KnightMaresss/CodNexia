'use client'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useAuth } from '@/components/auth-context'
import { canAccessAdmin } from '@/lib/roles'
import { useTranslations } from 'next-intl'
import { 
  User,
  Package,
  LogIn,
  Search,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Award
  } 
from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'
export function Navbar() {
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const { user, logout } = useAuth()
  const t = useTranslations('Navbar')
  const switchLanguage = (newLocale: string) => {
  router.replace(pathname, { locale: newLocale })
}
  return (
 <nav
  dir="ltr"
  className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_1px_20px_rgba(0,0,0,0.25)]"
>
     <div className="w-full px-4 py-0 flex items-center justify-between">
        {/* Logo */}
        {/* Left Side - Logo + Nav Links */}
        <div className="flex items-center gap-6">
          <Link href="/">
            <h1 style={{ fontFamily: "'Courier New', monospace", fontSize: "40px", fontWeight: "bold", margin: 0 }}>
              <span style={{ color: "#38b6ff" }}>COD</span>
              <span style={{ color: "#ffffff" }}>NEX</span>
              <span style={{ color: "#ff3131" }}>IA</span>
            </h1>
          </Link> 


<div className="relative group">
  <button
    type="button"
    className="h-8 min-w-[95px] rounded-xl border border-white/10 bg-white/5 px-2.5 text-sm text-white/90 backdrop-blur-xl transition-all hover:bg-white/10 flex items-center justify-between gap-2"
    aria-label="Select language"
  >
<span className="text-sm leading-none">🌐</span>
<span className="text-xs font-medium">
{locale.toUpperCase()}
</span>

    <svg className="h-4 w-4 text-white/70 transition-transform group-hover:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  </button>

  <div className="absolute left-0 top-full mt-2 w-36 overflow-hidden rounded-2xl border border-white/10 bg-[#0f1024]/95 p-1 shadow-2xl backdrop-blur-xl opacity-0 invisible translate-y-2 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
    {[
      { code: 'en', label: 'English' },
      { code: 'ar', label: 'العربية' },
      { code: 'de', label: 'Deutsch' },
      { code: 'fr', label: 'Français' },
      { code: 'ru', label: 'Русский' }
    ].map((lang) => (
      <button
        key={lang.code}
        type="button"
        onClick={() => switchLanguage(lang.code)}
        className={`w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all flex items-center justify-between ${
          locale === lang.code
            ? 'text-[#38b6ff]'
            : 'text-white/75 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span>{lang.label}</span>

        {locale === lang.code && (
          <span className="h-2 w-2 rounded-full bg-[#38b6ff] shadow-[0_0_12px_rgba(56,182,255,0.9)]" />
        )}
      </button>
    ))}
  </div>
</div>


        </div>
        {/* Right Side - Social + Auth */}
       <div className="flex items-center gap-3">
                   {!pathname?.startsWith('/admin') && (
            <>
              <a
                href="https://instagram.com/CodNexia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-110"
                aria-label="Instagram"
              >
                <svg className="h-4 w-4 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a
                href="https://t.me/CodNexia"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-[#0088cc] hover:border-transparent transition-all duration-300 hover:scale-110"
                aria-label="Telegram"
              >
                <svg className="h-4 w-4 text-white/90" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.348-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.464.141.119.098.152.228.168.331.016.103.036.339.02.531z"/>
                </svg>
              </a>
            </>
          )}
       

           {/* Auth */}
          {!pathname?.startsWith('/admin') && (
            <>
              {user ? (
                <div className="relative group">
                  {/* Trigger Button */}
                  <button className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg flex items-center gap-1">
                    <User className="h-4 w-4" />
                    <span className="hidden sm:inline">{user.name}</span>
                    <svg className="h-3 w-3 ms-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  <div className="absolute end-0 top-full mt-2 w-48 py-2 bg-[#1a1a2e] border border-white/10 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible hover:opacity-100 hover:visible transition-all duration-200 z-50">
                    <Link href="/portfolio" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                      <Award className="h-4 w-4" />
                      {t('portfolio')}
                    </Link>
                    <Link href="/orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                      <ShoppingCart className="h-4 w-4" />
                      {t('placeOrder')}
                    </Link>
                    <Link href="/track" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                      <Search className="h-4 w-4" />
                      {t('trackOrder')}
                    </Link>
                    <Link href="/my-orders" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                      <Package className="h-4 w-4" />
                     {t('myOrders')}
                    </Link>
                    <Link href="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
                      <User className="h-4 w-4" />
                     {t('myProfile')}
                    </Link>
                   {canAccessAdmin(user?.role) && (
  <Link href="/admin" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-colors">
    <LayoutDashboard className="h-4 w-4" />
    {t('dashboard')}
  </Link>
)}
                    <div className="border-t border-white/10 my-1"></div>
                    <button
                      onClick={async () => {
                        await logout()
                       window.location.href = '/en'
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors w-full text-start"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('logout')}
                    </button>
                  </div>
                </div>
              ) : (
                <Link href="/login">
                  <button className="px-3 py-1.5 text-sm bg-white/10 border border-white/20 text-white hover:bg-white/20 rounded-lg flex items-center gap-1">
                    <LogIn className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('signIn')}</span>
                  </button>
                </Link>
              )}
            </>
          )}
{user && <NotificationBell />}

<div className="flex items-center gap-3">


  <ThemeToggle />
</div>
        </div>
       
      </div>
    </nav>
  )
}