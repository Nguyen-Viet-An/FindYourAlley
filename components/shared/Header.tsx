import Image from "next/image"
import Link from "next/link"
import { Button } from "../ui/button"
import {
    SignInButton,
    SignedIn,
    SignedOut,
    UserButton
  } from '@clerk/nextjs'
import NavItems from "./NavItems"
import MobileNav from "./MobileNav"
import ThemeToggle from "./ThemeToggle"
import LanguageSwitcher from "./LanguageSwitcher"
import { auth } from '@clerk/nextjs/server'
import { getTranslations } from 'next-intl/server'

const ADMIN_USER_ID = '67db65cdd14104a0c014576d';

const Header = async () => {
    const { sessionClaims } = await auth();
    const userId = sessionClaims?.userId as string;
    const isAdmin = userId === ADMIN_USER_ID;
    const t = await getTranslations('nav');

    return (
      <header className="w-full border-b bg-background">
        <div className="wrapper flex items-center justify-between">
          <Link href="/" className="w-36">
            <Image
              src="/assets/images/squid.png" width={60} height={5}
              alt="FindYourAlley logo"
            />
          </Link>

          <SignedIn>
            <nav className="md:flex-between hidden w-full max-w-xs">
              <NavItems isAdmin={isAdmin} />
            </nav>
          </SignedIn>

          <div className="flex w-32 justify-end gap-3 items-center">
            <LanguageSwitcher />
            <ThemeToggle />
            <SignedIn>
              <UserButton />
              <MobileNav isAdmin={isAdmin} />
            </SignedIn>
            <SignedOut>
              <Button asChild className="rounded-full" size="lg">
                <Link href="/sign-in">
                  {t('signIn')}
                </Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </header>
    )
  }

  export default Header