'use client';

import Link from 'next/link';
import { Button } from '@/core/components/ui/button';
import { syne } from '@/fonts/syne';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter()

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center max-w-md">
                {/* 404 Number */}
                <div className="mb-8">
                    <h1 className={`${syne.className} text-9xl font-black text-primary opacity-20 tracking-wide`}>
                        404
                    </h1>
                </div>

                {/* Heading */}
                <h2 className={`${syne.className} text-5xl font-bold text-foreground mb-4 leading-relaxed`}>
                    Page Not Found
                </h2>

                {/* Description */}
                <p className="text-muted-foreground text-base mb-10 leading-relaxed font-medium">
                    Sorry, the page you're looking for doesn't exist or has been moved.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center mb-10">
                    <Button
                        onClick={() => router.back()}
                        variant="outline"
                        className="w-full sm:w-auto font-semibold"
                    >
                        Go Back
                    </Button>
                    <Link href="/" className="w-full sm:w-auto">
                        <Button className="w-full font-semibold">Go Home</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
