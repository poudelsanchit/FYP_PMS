import Link from "next/link";
import { AnimatedGroup } from "../../components/animated-group";
import { ArrowRight } from "lucide-react";
import { Button } from "@/core/components/ui/button";
import Image from "next/image";
import DarkImage from "../assets/herodark.jpg";
import LightImage from "../assets/herolight.png";
const transitionVariants = {
    item: {
        hidden: {
            opacity: 0,
            filter: "blur(12px)",
            y: 12,
        },
        visible: {
            opacity: 1,
            filter: "blur(0px)",
            y: 0,
            transition: {
                type: "spring" as const,
                bounce: 0.3,
                duration: 1.5,
            },
        },
    },
} as const;

export default function HeroSection() {

    return <section >
        <div className="relative pt-24 md:pt-36">
            <div className="mx-auto max-w-7xl px-6">
                <div className="text-center sm:mx-auto lg:mr-auto lg:mt-0">
                    <AnimatedGroup variants={transitionVariants}>
                        <Link
                            href="#link"
                            className="hover:bg-background dark:hover:border-t-border bg-muted group mx-auto flex w-fit items-center gap-4 rounded-full border p-1 pl-4 shadow-md shadow-zinc-950/5 transition-colors duration-300 dark:border-t-white/5 dark:shadow-zinc-950"
                        >
                            <span className="text-foreground text-sm">
                                Organize tasks effortlessly 🚀⚡
                            </span>
                            <span className="dark:border-background block h-4 w-0.5 border-l bg-white dark:bg-zinc-700"></span>

                            <div className="bg-background group-hover:bg-muted size-6 overflow-hidden rounded-full duration-500">
                                <div className="flex w-12 -translate-x-1/2 duration-500 ease-in-out group-hover:translate-x-0">
                                    <span className="flex size-6">
                                        <ArrowRight className="m-auto size-3 dark:text-white text-black" />
                                    </span>
                                    <span className="flex size-6">
                                        <ArrowRight className="m-auto size-3 dark:text-white text-black" />
                                    </span>
                                </div>
                            </div>
                        </Link>
                    </AnimatedGroup>

                    {/* preset="fade-in-blur" speedSegment={0.3} */}
                    <AnimatedGroup variants={transitionVariants}>
                        <div className="mt-8 text-balance text-5xl sm:5xl md:text-7xl lg:mt-16 xl:text-[5.25rem] dark:text-white text-black">
                            Modern Solutions for Tasks Management
                        </div>
                        {/* preset="fade-in-blur" speedSegment={0.3} */}

                        <div className="mx-auto mt-8 max-w-2xl text-balance text-lg">
                            A powerful change management app built for software teams.
                            Rebase helps you adapt to Changes, Collaboration and
                            Execution
                        </div>
                    </AnimatedGroup>

                    <AnimatedGroup
                        variants={{
                            container: {
                                visible: {
                                    transition: {
                                        staggerChildren: 0.05,
                                        delayChildren: 0.75,
                                    },
                                },
                            },
                            ...transitionVariants,
                        }}
                        className="mt-12 flex flex-col items-center justify-center gap-2 md:flex-row"
                    >
                        <div
                            key={1}
                            className="bg-foreground/10 rounded-sm border p-0.5"
                        >
                            <Button
                                asChild
                                size="lg"
                                className="rounded-sm px-5 text-base"
                            >
                                <Link href="/auth/login">
                                    <span className="text-nowrap">Get Started Here</span>
                                </Link>
                            </Button>
                        </div>
                        <Button
                            key={2}
                            asChild
                            size="lg"
                            variant="secondary"
                            className=" rounded-sm px-5 dark:text-white text-black "
                        >
                            <Link href="#link">
                                <span className="text-nowrap">Request a demo</span>
                            </Link>
                        </Button>
                    </AnimatedGroup>
                </div>
            </div>

            <AnimatedGroup
                variants={{
                    container: {
                        visible: {
                            transition: {
                                staggerChildren: 0.05,
                                delayChildren: 0.75,
                            },
                        },
                    },
                    ...transitionVariants,
                }}
            >
                <div className="w-full px-2 mt-6 sm:mt-8 md:mt-12 lg:mt-16">
                    <div
                        aria-hidden
                        className="absolute inset-0 z-10 bg-linear-to-b from-transparent dark:from-35% from-65% to-background"
                    />
                    <div className="relative mx-auto max-w-6xl overflow-hidden rounded-lg sm:rounded-xl md:rounded-2xl border p-2 sm:p-3 md:p-4   dark:ring-white/20 bg-background">
                        <Image
                            className="aspect-15/8 relative hidden rounded-lg sm:rounded-xl md:rounded-2xl dark:block"
                            src={DarkImage}
                            alt="Application screenshot"
                            width={2700}
                            height={1440}
                            priority
                        />
                        <Image
                            className="aspect-15/8 relative rounded-lg sm:rounded-xl md:rounded-2xl border border-border/25 dark:hidden"
                            src={LightImage}
                            alt="Application screenshot"
                            width={2700}
                            height={1440}
                            priority
                        />
                    </div>
                </div>
            </AnimatedGroup>
        </div>
    </section >
}