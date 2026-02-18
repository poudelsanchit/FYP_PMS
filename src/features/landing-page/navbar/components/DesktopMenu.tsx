// components/navbar/DesktopMenu.tsx
import Link from "next/link";
import { MenuItem } from "../types/types";
import { useNavigation } from "@/core/hooks/useNavigation";

interface DesktopMenuProps {
    items: MenuItem[];
}

export const DesktopMenu = ({ items }: DesktopMenuProps) => {
    const { handleMenuClick, toInitial } = useNavigation();

    const handleNavigation = (href: string) => {
        if (href === "/") {
            toInitial()
        }
        handleMenuClick(href)
    }

    return (
        <div className="absolute inset-0 m-auto hidden size-fit lg:block">
            <ul className="flex gap-8 text-sm">
                {items.map((item, index) => (
                    <li key={index}>
                        <div
                            onClick={() => handleNavigation(item.href)}
                            className="text-muted-foreground cursor-pointer hover:text-accent-foreground block duration-150"
                        >
                            <span>{item.name}</span>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}