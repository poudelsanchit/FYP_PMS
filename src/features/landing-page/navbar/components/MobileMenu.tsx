// components/navbar/MobileMenu.tsx
import Link from "next/link";
import { MenuItem } from "../types/types";

interface MobileMenuProps {
    items: MenuItem[];
}

export const MobileMenu = ({ items }: MobileMenuProps) => (
    <div className="lg:hidden">
        <ul className="space-y-6 text-base">
            {items.map((item, index) => (
                <li key={index}>
                    <Link
                        href={item.href}
                        className="text-muted-foreground hover:text-accent-foreground block duration-150"
                    >
                        <span>{item.name}</span>
                    </Link>
                </li>
            ))}
        </ul>
    </div>
);
