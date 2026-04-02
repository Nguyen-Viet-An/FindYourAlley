import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
  } from "@/components/ui/sheet"
  import Image from "next/image"
  import { Separator } from "../ui/separator"
  import NavItems from "./NavItems"


  const MobileNav = ({ isAdmin = false }: { isAdmin?: boolean }) => {
    return (
      <nav className="md:hidden">
        <Sheet>
          <SheetTrigger className="align-middle">
            <Image
              src="/assets/icons/menu.svg"
              alt="menu"
              width={24}
              height={24}
              className="cursor-pointer dark:invert"
            />
          </SheetTrigger>
          <SheetContent className="flex flex-col gap-6 bg-white dark:bg-card md:hidden">
            <Image
              src="/assets/images/squid.png"
              alt="logo"
              width={60}
              height={10}
            />
            <Separator className="border border-gray-50" />
            <NavItems isAdmin={isAdmin} />
          </SheetContent>
        </Sheet>
      </nav>
    )
  }

  export default MobileNav