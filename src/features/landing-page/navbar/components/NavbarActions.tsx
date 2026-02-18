// components/navbar/NavbarActions.tsx
import Link from "next/link";
import { Button } from "@/core/components/ui/button";
import { cn } from "@/core/utils/utils";

interface NavbarActionsProps {
  isScrolled: boolean;
}
export default function NavbarActions({ isScrolled }: NavbarActionsProps) {
  return <div className="flex w-full flex-col space-y-3 sm:flex-row sm:gap-3 sm:space-y-0 md:w-fit">
    <Button
      asChild
      variant="outline"
      size="sm"
      className={cn("dark:text-white text-black", isScrolled && "lg:hidden")}
    >
      <Link href="/auth/login">
        <span className="font-semibold">Login</span>
      </Link>
    </Button>
    {/* <Button asChild size="sm" className={cn(isScrolled && "lg:hidden")}>
      <Link href="/auth/signup">
        <span className="font-semibold">Sign Up</span>
      </Link>
    </Button> */}
    <Button
      asChild
      size="sm"
      className={cn(isScrolled ? "lg:inline-flex" : "hidden")}
    >
      <Link href="/auth/login">
        <span className="font-semibold">Get Started</span>
      </Link>
    </Button>
  </div>
}
