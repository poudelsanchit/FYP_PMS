"use client";

import { useEffect } from "react";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

export default function Meetings() {
    const { setSegments, clear } = useBreadcrumbStore();

    useEffect(() => {
        setSegments([{ label: "Meetings" }]);
        return () => clear();
    }, [setSegments, clear]);

    return <div className="flex h-full">
        Meetings Feature Coming Soon
    </div>
}