// components/navbar/MenuToggle.tsx
import { Menu, X } from "lucide-react";
import { cn } from "@/core/utils/utils";

interface MenuToggleProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const MenuToggle = ({ isOpen, onToggle }: MenuToggleProps) => (
    <button
        onClick={onToggle}
        aria-label={isOpen ? "Close Menu" : "Open Menu"}
        className="relative z-20 -m-2.5 -mr-4 block cursor-pointer p-2.5 lg:hidden"
    >
        <Menu
            className={cn(
                "m-auto size-6 duration-200",
                isOpen && "rotate-180 scale-0 opacity-0"
            )}
        />
        <X
            className={cn(
                "absolute inset-0 m-auto size-6 -rotate-180 scale-0 opacity-0 duration-200",
                isOpen && "rotate-0 scale-100 opacity-100"
            )}
        />
    </button>
);
