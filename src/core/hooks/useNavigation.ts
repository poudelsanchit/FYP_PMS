"use client";

import { useRef } from "react";
import { scrollToElement } from "@/core/utils/scroll";
import { usePathname, useRouter } from "next/navigation"; // ✅ Correct for App Router

export const useNavigation = () => {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const handleMenuClick = (id: string) => {
    const multiPageRoutes: { [key: string]: string } = {
      projects: "/projects",
      contact: "/contact",
      gallery: "/gallery",
      resume: "/resume",
    };

    if (multiPageRoutes[id]) {
      return;
    }

    if (pathname !== "/") {
      router.push("/");

      // Delay scroll to allow the page to load
      setTimeout(() => {
        scrollToElement(id);
      }, 500); // 500ms to 800ms usually works fine

      return;
    }

    scrollToElement(id);
  };

  const toInitial = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ behavior: "smooth", top: 0 });
    }
  };
  return { menuRef, handleMenuClick, toInitial };
};
