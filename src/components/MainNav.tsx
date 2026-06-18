"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CubeIcon,
  ListBulletIcon,
  CameraIcon,
  PlusIcon,
  CubeTransparentIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/components/ThemeProvider";

const navItems = [
  { name: "Главная", href: "/", icon: CubeIcon },
  { name: "Добавить товар", href: "/add-product", icon: PlusIcon },
  { name: "Список товаров", href: "/products", icon: ListBulletIcon },
  { name: "Сканировать код", href: "/scan", icon: CameraIcon },
  { name: "Управление коробками", href: "/boxes", icon: CubeTransparentIcon },
];

const helpItems = [
  { name: "Помощь", href: "/help", icon: QuestionMarkCircleIcon },
  { name: "О системе", href: "/about", icon: InformationCircleIcon },
];

export default function MainNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close mobile menu on page change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Close on click outside (for mobile version)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    }

    if (mobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [mobileMenuOpen]);

  // Restore sidebar collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar_collapsed");
    if (saved) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem("sidebar_collapsed", String(nextState));
  };

  return (
    <>
      {/* --- DESKTOP SIDEBAR PANEL --- */}
      <aside
        className={`hidden md:flex flex-col h-screen sticky top-0 left-0 bg-card border-r border-[var(--card-border)] text-[var(--text-color-primary)] transition-all duration-300 z-40 ${
          isCollapsed ? "w-16" : "w-64"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-[var(--card-border)]">
          <Link href="/" className="flex items-center overflow-hidden min-w-0">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <CubeIcon className="h-5 w-5 text-white" />
            </div>
            {!isCollapsed && (
              <span className="ml-3 font-bold text-sm tracking-widest text-[var(--text-color-primary)] uppercase truncate animate-fadeIn">
                Mila ERP
              </span>
            )}
          </Link>

          {/* Collapse Button */}
          {!isCollapsed && (
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)] transition-colors"
              title="Свернуть меню"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Expand Button (when collapsed) */}
        {isCollapsed && (
          <div className="flex justify-center py-2 border-b border-[var(--card-border)]">
            <button
              onClick={toggleCollapse}
              className="p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-muted)] hover:text-[var(--text-color-primary)] transition-colors"
              title="Развернуть меню"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold"
                    : "text-[var(--text-color-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-color-primary)]"
                }`}
              >
                <item.icon
                  className={`h-5 w-5 flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-indigo-500 dark:text-indigo-400"
                      : "text-[var(--text-color-muted)] group-hover:text-[var(--text-color-primary)]"
                  }`}
                />
                
                {!isCollapsed ? (
                  <span className="ml-3 truncate animate-fadeIn">{item.name}</span>
                ) : (
                  <div className="absolute left-16 scale-0 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-left shadow-lg pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Additional Links and Theme Settings */}
        <div className="p-2 border-t border-[var(--card-border)] space-y-1">
          {/* Help Section */}
          {helpItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all group relative ${
                  isActive
                    ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400"
                    : "text-[var(--text-color-muted)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-color-primary)]"
                }`}
              >
                <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="ml-3 truncate">{item.name}</span>
                ) : (
                  <div className="absolute left-16 scale-0 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-left shadow-lg pointer-events-none z-50 whitespace-nowrap">
                    {item.name}
                  </div>
                )}
              </Link>
            );
          })}

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center px-3 py-2.5 rounded-lg text-xs font-medium text-[var(--text-color-secondary)] hover:bg-black/5 dark:hover:bg-white/5 hover:text-[var(--text-color-primary)] transition-all group relative"
          >
            {theme === "dark" ? (
              <>
                <SunIcon className="h-4.5 w-4.5 text-amber-500 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="ml-3 truncate text-amber-500">Светлая тема</span>
                ) : (
                  <div className="absolute left-16 scale-0 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-left shadow-lg pointer-events-none z-50 whitespace-nowrap">
                    Светлая тема
                  </div>
                )}
              </>
            ) : (
              <>
                <MoonIcon className="h-4.5 w-4.5 text-indigo-500 flex-shrink-0" />
                {!isCollapsed ? (
                  <span className="ml-3 truncate text-indigo-500">Тёмная тема</span>
                ) : (
                  <div className="absolute left-16 scale-0 bg-gray-900 text-white text-xs rounded-md px-2 py-1.5 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all duration-150 origin-left shadow-lg pointer-events-none z-50 whitespace-nowrap">
                    Тёмная тема
                  </div>
                )}
              </>
            )}
          </button>
        </div>
      </aside>

      {/* --- MOBILE TOP NAVIGATION --- */}
      <header className="md:hidden sticky top-0 left-0 right-0 h-14 bg-card border-b border-[var(--card-border)] flex items-center justify-between px-4 z-40">
        <Link href="/" className="flex items-center">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <CubeIcon className="h-5 w-5 text-white" />
          </div>
          <span className="ml-2 font-bold text-xs tracking-wider text-[var(--text-color-primary)] uppercase">
            Mila ERP
          </span>
        </Link>

        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-secondary)] transition-colors min-h-[44px]"
            title="Переключить тему"
          >
            {theme === "dark" ? (
              <SunIcon className="h-5 w-5 text-amber-500" />
            ) : (
              <MoonIcon className="h-5 w-5 text-indigo-500" />
            )}
          </button>

          {/* Hamburger Menu */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-secondary)] transition-colors min-h-[44px]"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      <div
        className={`md:hidden fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 z-50 ${
          mobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <div
          ref={menuRef}
          className={`fixed top-0 bottom-0 left-0 bg-card w-72 max-w-[85%] border-r border-[var(--card-border)] shadow-2xl flex flex-col transition-transform duration-300 ${
            mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {/* Drawer Header */}
          <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--card-border)]">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <CubeIcon className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 font-bold text-xs tracking-wider text-[var(--text-color-primary)] uppercase">
                Навигация
              </span>
            </div>
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 text-[var(--text-color-secondary)] min-h-[44px]"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Menu Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center px-4 py-3 mb-1 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? "bg-indigo-500/10 text-indigo-500 dark:text-indigo-400 font-semibold"
                      : "text-[var(--text-color-secondary)] hover:bg-black/5 dark:hover:bg-white/5"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="h-6 w-6 mr-3 text-[var(--text-color-muted)]" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Drawer Footer */}
          <div className="p-4 border-t border-[var(--card-border)] space-y-3 bg-[var(--background)]/40">
            {helpItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center text-sm font-medium text-[var(--text-color-secondary)]"
                onClick={() => setMobileMenuOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3 text-[var(--text-color-muted)]" />
                {item.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
