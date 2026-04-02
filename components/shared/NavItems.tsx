'use client';

import { headerLinks } from '@/constants'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useRef, useEffect } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Resolve a dotted translation key like "nav.home"
function useT() {
  const t = useTranslations();
  return (key: string) => {
    try { return t(key as any); } catch { return key; }
  };
}

const NavItems = ({ isAdmin = false }: { isAdmin?: boolean }) => {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = useT();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <ul className="md:flex-between flex w-full flex-col items-start gap-5 md:flex-row">
      {headerLinks.filter((link) => !link.adminOnly || isAdmin).map((link) => {
        const isActive = pathname === link.route ||
          link.children?.some((child) => pathname === child.route);

        if (link.children) {
          return (
            <li
              key={link.route}
              className="relative flex-center p-medium-16 whitespace-nowrap"
              ref={dropdownRef as any}
            >
              <button
                onClick={() => setOpenDropdown(openDropdown === link.route ? null : link.route)}
                className={`${isActive ? 'text-primary-500' : ''} flex items-center gap-1`}
              >
                {t(link.label)}
                <ChevronDown className="w-4 h-4" />
              </button>
              {openDropdown === link.route && (
                <div className="md:absolute md:top-full md:left-0 md:mt-2 md:bg-white md:dark:bg-card md:border md:rounded-lg md:shadow-lg md:py-1 md:min-w-[160px] md:z-50 flex flex-col ml-4 md:ml-0 mt-2 md:mt-2">
                  {link.children.map((child) => (
                    <Link
                      key={child.route}
                      href={child.route}
                      className={`px-4 py-2 text-sm hover:bg-grey-50 dark:hover:bg-muted transition-colors ${
                        pathname === child.route ? 'text-primary-500' : ''
                      }`}
                      onClick={() => setOpenDropdown(null)}
                    >
                      {t(child.label)}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          );
        }

        return (
          <li
            key={link.route}
            className={`${
              isActive && 'text-primary-500'
            } flex-center p-medium-16 whitespace-nowrap`}
          >
            <Link href={link.route}>{t(link.label)}</Link>
          </li>
        )
      })}
    </ul>
  )
}

export default NavItems