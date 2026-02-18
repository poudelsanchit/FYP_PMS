// components/navbar/Navbar.tsx
"use client";
import { menuItems } from "../constants/constants";
import { NavbarLogo } from "./NavbarLogo";
import { useNavbar } from "../hooks/useNavbar";
import { DesktopMenu } from "./DesktopMenu";
import { MobileMenu } from "./MobileMenu";
import NavbarActions from "./NavbarActions";
import { cn } from "@/core/utils/utils";
import { MenuToggle } from "./MenuToggle";

export const Navbar = () => {
    const { menuState, isScrolled, toggleMenu } = useNavbar();

    return (
        <header>
            <nav className="fixed z-20 w-full px-2 font-semibold">
                <div
                    className={cn(
                        "mx-auto mt-2 max-w-6xl px-6 transition-all duration-300 lg:px-12",
                        isScrolled &&
                        "bg-background/50 max-w-4xl rounded-2xl border backdrop-blur-lg lg:px-5"
                    )}
                >
                    <div className="relative flex flex-wrap items-center justify-between gap-6 py-3 lg:gap-0 lg:py-4">
                        <div className="flex w-full justify-between lg:w-auto">
                            <NavbarLogo />
                            <MenuToggle isOpen={menuState} onToggle={toggleMenu} />
                        </div>

                        <DesktopMenu items={menuItems} />

                        <div
                            className={cn(
                                "bg-background mb-6 w-full flex-wrap items-center justify-end space-y-8 rounded-3xl border p-6 shadow-2xl shadow-zinc-300/20 md:flex-nowrap lg:m-0 lg:flex lg:w-fit lg:gap-6 lg:space-y-0 lg:border-transparent lg:bg-transparent lg:p-0 lg:shadow-none dark:shadow-none dark:lg:bg-transparent",
                                menuState ? "block" : "hidden",
                                "lg:flex"
                            )}
                        >
                            <MobileMenu items={menuItems} />
                            <NavbarActions isScrolled={isScrolled} />
                        </div>
                    </div>
                </div>
            </nav>
        </header>
    );
};