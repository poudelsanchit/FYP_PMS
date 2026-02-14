import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
export default function useSidebarLogo() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);
  const logo =
    mounted && resolvedTheme === "dark" ? "/lightLogo.png" : "/darkLogo.png";

  return { logo };
}
