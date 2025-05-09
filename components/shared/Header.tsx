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


const Header = () => {
    return (
      <header className="w-full border-b">
        <div className="wrapper flex items-center justify-between">
          <Link href="/" className="w-36">
            <Image 
              src="/assets/images/squid.png" width={60} height={5}
              alt="FindYourAlley logo" 
            />
          </Link>
  
          <SignedIn>
            <nav className="md:flex-between hidden w-full max-w-xs">
              <NavItems />
            </nav>
          </SignedIn>
  
          <div className="flex w-32 justify-end gap-3">
            <SignedIn>
              <UserButton />
              <MobileNav />
            </SignedIn>
            <SignedOut>
              <Button asChild className="rounded-full" size="lg">
                <Link href="/sign-in">
                  Đăng nhập
                </Link>
              </Button>
            </SignedOut>
          </div>
        </div>
      </header>
    )
  }
  
  export default Header