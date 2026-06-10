'use client'
import { Link, usePathname, useRouter } from '@/i18n/navigation'
import { useLocale } from 'next-intl'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/components/auth-context'
import { canAccessAdmin } from '@/lib/roles'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { 
  User,
  Package,
  LogIn,
  Search,
  ShoppingCart,
  LogOut,
  LayoutDashboard,
  Award,
  MessageSquare,
  Sparkles
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { NotificationBell } from '@/components/notifications/NotificationBell'

export function Navbar() {
  const [languageOpen, setLanguageOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const locale = useLocale()
  const { user, logout } = useAuth()
  const t = useTranslations('Navbar')
  const userDropdownRef = useRef<HTMLDivElement>(null)
  const languageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false)
      }
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setLanguageOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const switchLanguage = (newLocale: string) => {
    setLanguageOpen(false)
    router.replace(pathname, { locale: newLocale })
  }

  const handleUserDropdownClick = () => {
    if (window.innerWidth < 1024) {
      setUserDropdownOpen(!userDropdownOpen)
    }
  }

  return (
    <nav
      dir="ltr"
      className="fixed top-0 left-0 right-0 z-50 bg-[#0a0a1a]/95 backdrop-blur-xl border-b border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.4)]"
    >
      <div className="w-full px-3 sm:px-6 lg:px-8">
     <div className="flex items-center justify-between h-10 lg:h-14">
          
          {/* Logo Section - Premium */}
          <div className="flex items-center gap-2 lg:gap-4">
            <Link 
              href="/" 
              className="group relative flex items-center gap-2 transition-all duration-300 hover:scale-[1.02]"
            >
              {/* Animated glow behind logo */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-[#38b6ff]/20 via-transparent to-[#ff3131]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <Image
                src="/logo.png"
                alt="Codnexia logo"
                width={80}
                height={80}
                priority
                className="h-9 sm:h-10 lg:h-12 w-auto relative z-10 drop-shadow-[0_0_12px_rgba(56,182,255,0.3)] group-hover:drop-shadow-[0_0_20px_rgba(56,182,255,0.5)] transition-all duration-300"
              />
              {/* Logo text - hidden on mobile, visible on sm+ */}
              <div className="hidden sm:block relative">
                <h1
                  className="text-xl sm:text-2xl lg:text-[36px] leading-none tracking-tight"
                  style={{
                    fontFamily: "'Inter', 'Courier New', monospace",
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                  }}
                >
                  <span className="bg-gradient-to-r from-[#38b6ff] to-[#5cc8ff] bg-clip-text text-transparent">COD</span>
                  <span className="text-white/90">NEX</span>
                  <span className="bg-gradient-to-r from-[#ff3131] to-[#ff5a5a] bg-clip-text text-transparent">IA</span>
                </h1>
                <div className="absolute -bottom-1 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#38b6ff]/50 to-transparent scale-x-0 group-hover:scale-x-100 transition-transform duration-500" />
              </div>
            </Link>
                        {/* Language Switcher - Premium */}
            <div className="relative group" ref={languageRef}>
              <button
                type="button"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    setLanguageOpen((open) => !open)
                  }
                }}
                className="relative h-8 sm:h-9 lg:h-10 min-w-[65px] lg:min-w-[90px] rounded-xl border border-white/10 bg-white/5 px-2 lg:px-3 text-sm text-white/90 backdrop-blur-xl transition-all duration-300 hover:bg-white/10 hover:border-white/20 hover:shadow-[0_0_20px_rgba(56,182,255,0.1)] flex items-center justify-between gap-1 sm:gap-2 overflow-hidden group/language"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#38b6ff]/0 via-[#38b6ff]/5 to-[#ff3131]/0 opacity-0 group-hover/language:opacity-100 transition-opacity duration-500" />
                <span className="text-sm lg:text-base leading-none">🌐</span>
                <span className="text-xs lg:text-sm font-semibold tracking-wide">{locale.toUpperCase()}</span>
                <svg 
                  className="h-2.5 w-2.5 sm:h-3 sm:w-3 lg:h-3.5 lg:w-3.5 text-white/50 transition-all duration-300 group-hover/language:rotate-180" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

<div className={`
 absolute -left-4 lg:left-0 top-full mt-2 w-44
  rounded-2xl border border-white/10 bg-[#0f1024]/95
  shadow-[0_20px_40px_-15px_rgba(0,0,0,0.5)]
  backdrop-blur-2xl z-50 transition-all duration-300 origin-top
  lg:opacity-0 lg:invisible lg:scale-y-95 lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:scale-y-100
  ${languageOpen ? 'opacity-100 visible scale-y-100' : 'opacity-0 invisible scale-y-95'}
`}>
                <div className="p-1.5 space-y-0.5">
                  {[
                    { code: 'en', label: 'English', flag: '🇬🇧' },
                    { code: 'ar', label: 'العربية', flag: '🇸🇦' },
                    { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
                    { code: 'fr', label: 'Français', flag: '🇫🇷' },
                    { code: 'ru', label: 'Русский', flag: '🇷🇺' }
                  ].map((lang) => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={() => switchLanguage(lang.code)}
                      className={`
                        w-full rounded-xl px-3 py-2.5 text-left text-sm transition-all duration-200
                        flex items-center justify-between gap-3
                        ${locale === lang.code
                          ? 'bg-gradient-to-r from-[#38b6ff]/10 to-transparent text-[#38b6ff]'
                          : 'text-white/60 hover:bg-white/10 hover:text-white'
                        }
                      `}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </div>
                      {locale === lang.code && (
                        <div className="h-1.5 w-1.5 rounded-full bg-[#38b6ff] shadow-[0_0_8px_rgba(56,182,255,0.8)] animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side - Premium Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:gap-3">



            {/* Notification Bell */}
            {user && <NotificationBell />}
             {/* Auth Section - Premium */}
            {!pathname?.startsWith('/admin') && (
              <>
                {user ? (
                  <div className="relative group/auth" ref={userDropdownRef}>
                    <button 
                      onClick={handleUserDropdownClick}
                      className="relative flex h-8 sm:h-9 lg:h-10 items-center gap-1.5 sm:gap-2 rounded-xl border border-white/10 bg-white/5 px-2.5 sm:px-3 lg:px-4 text-sm font-medium text-white/90 backdrop-blur-xl transition-all duration-300 hover:border-[#38b6ff]/30 hover:bg-[#38b6ff]/5 hover:shadow-[0_0_25px_rgba(56,182,255,0.12)] active:scale-95 overflow-hidden group/auth-btn"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-[#38b6ff]/0 via-[#38b6ff]/5 to-[#ff3131]/0 opacity-0 group-hover/auth-btn:opacity-100 transition-opacity duration-700" />
                      <div className="relative flex items-center gap-1.5 sm:gap-2">
                        <div className="relative">
                          <User className="h-3.5 w-3.5 lg:h-4 lg:w-4 text-[#38b6ff]" />
                          <div className="absolute -top-1 -right-1 h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-green-500 ring-2 ring-[#0a0a1a] animate-pulse" />
                        </div>
                        <span className="hidden sm:inline text-sm">{user.name?.split(' ')[0] || user.name}</span>
                        <svg className={`h-2.5 w-2.5 sm:h-3 sm:w-3 text-white/50 transition-transform duration-300 ${userDropdownOpen ? 'rotate-180' : ''} lg:group-hover/auth:rotate-180`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </button>

                    <div className={`
                      absolute end-0 top-full mt-2 w-56 py-2 bg-[#1a1a2e] border border-white/10 rounded-2xl shadow-2xl backdrop-blur-2xl transition-all duration-300 origin-top-right z-50
                      lg:opacity-0 lg:invisible lg:scale-95 lg:group-hover/auth:opacity-100 lg:group-hover/auth:visible lg:group-hover/auth:scale-100
                      ${userDropdownOpen ? 'opacity-100 visible scale-100' : 'opacity-0 invisible scale-95'}
                    `}>
<div className="px-4 py-3 border-b border-white/10 mb-1">
  <div className="flex items-center gap-3">
{user.profilePic ? (
  <Image
    src={user.profilePic}
    alt={user.name || 'Profile'}
    width={40}
    height={40}
    className="h-10 w-10 rounded-full object-cover ring-2 ring-[#38b6ff]/20"
  />
) : (
  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#38b6ff] to-[#2a9df4] flex items-center justify-center text-white font-semibold">
    {user.name?.charAt(0).toUpperCase()}
  </div>
)}

    <div className="min-w-0">
      <p className="text-sm font-semibold text-white truncate">
        {user.name}
      </p>

      <p className="text-xs text-white/50 truncate">
        {user.email}
      </p>
    </div>
  </div>
</div>
                      <Link href="/portfolio" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <Award className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('portfolio')}
                      </Link>
                      <Link href="/orders" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <ShoppingCart className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('placeOrder')}
                      </Link>
                      <Link href="/track" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <Search className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('trackOrder')}
                      </Link>
                      <Link href="/my-orders" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <Package className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('myOrders')}
                      </Link>
                      <Link href="/profile" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <User className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('myProfile')}
                      </Link>
                      <Link href="/feedback" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
                        <MessageSquare className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
                        {t('feedback')}
                      </Link>




{canAccessAdmin(user?.role) && (
  <Link href="/admin" className="flex items-center gap-3 px-4 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/10 transition-all duration-200 group/item">
    <LayoutDashboard className="h-3.5 w-3.5 text-white/40 group-hover/item:text-[#38b6ff] transition-colors" />
    {t('dashboard')}
  </Link>
)}

{/* Social Media Section - Original Icons */}
<div className="border-t border-white/10 my-1"></div>
<div className="px-4 py-2">
 <p className="text-xs text-white/40 mb-2">{t('social')}</p>
  <div className="flex gap-2">
  <a
  href="https://instagram.com/CodNexia"
  target="_blank"
  rel="noopener noreferrer"
  className="flex-1 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-2 text-white/70 hover:text-white hover:bg-gradient-to-br hover:from-pink-500 hover:to-purple-500 hover:border-transparent transition-all duration-300"
  aria-label="Instagram"
>
  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4c0 3.2-2.6 5.8-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8C2 4.6 4.6 2 7.8 2zm-.2 2C5.6 4 4 5.6 4 7.6v8.8C4 18.4 5.6 20 7.6 20h8.8c2 0 3.6-1.6 3.6-3.6V7.6C20 5.6 18.4 4 16.4 4H7.6zm9.6 1.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5zM12 7c2.8 0 5 2.2 5 5s-2.2 5-5 5-5-2.2-5-5 2.2-5 5-5zm0 2c-1.7 0-3 1.3-3 3s1.3 3 3 3 3-1.3 3-3-1.3-3-3-3z"/>
  </svg>
</a>
    <a
      href="https://t.me/CodNexia"
      target="_blank"
      rel="noopener noreferrer"
      className="flex-1 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 py-2 text-white/70 hover:text-white hover:bg-[#0088cc] hover:border-transparent transition-all duration-300"
      aria-label="Telegram"
    >
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.015-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.242-1.865-.442-.751-.244-1.348-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.464.141.119.098.152.228.168.331.016.103.036.339.02.531z"/>
      </svg>
    </a>
  </div>
</div>

<div className="border-t border-white/10 my-1"></div>

{/* Theme Toggle */}
<div className="px-4 py-2">
  <div className="flex items-center justify-between">
   <span className="text-sm text-gray-300">{t('theme')}</span>
    <ThemeToggle />
  </div>
</div>

<div className="border-t border-white/10 my-1"></div>

<button
  onClick={async () => {
    await logout()
    window.location.href = '/en'
  }}
  className="flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200 w-full group/item"
>
  <LogOut className="h-3.5 w-3.5 group-hover/item:translate-x-0.5 transition-transform" />
  {t('logout')}
</button>

                    </div>
                  </div>
                ) : (
                  <Link href="/login">
                    <button className="relative group/btn flex h-8 sm:h-9 lg:h-10 items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-[#38b6ff] to-[#2a9df4] px-3 sm:px-4 lg:px-5 text-sm font-semibold text-white shadow-[0_4px_20px_rgba(56,182,255,0.3)] transition-all duration-300 hover:shadow-[0_6px_25px_rgba(56,182,255,0.45)] hover:scale-[1.02] active:scale-95 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent translate-x-[-100%] group-hover/btn:translate-x-0 transition-transform duration-500" />
                      <LogIn className="h-3.5 w-3.5 relative z-10" />
                      <span className="hidden sm:inline relative z-10">{t('signIn')}</span>
                      <Sparkles className="h-3 w-3 absolute right-3 opacity-0 group-hover/btn:opacity-100 transition-all duration-300 group-hover/btn:translate-x-1" />
                    </button>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}