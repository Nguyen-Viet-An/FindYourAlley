import Image from "next/image"
import Link from "next/link"

const Footer = () => {
  return (
    <footer className="border-t">
      <div className="flex-center wrapper flex-between flex flex-col gap-4 p-5 text-center sm:flex-row">
        <Link href='/'>
          <Image 
            src="/assets/images/squid.png"
            alt="logo"
            width={60}
            height={5}
          />
        </Link>

        <p>2025 FindYourAlley. Bản quyền thuộc về Myosotis Diamandis (Fb).</p>
      </div>
    </footer>
  )
}

export default Footer