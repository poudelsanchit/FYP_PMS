"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/core/components/ui/accordion";
import { DynamicIcon, } from "lucide-react/dynamic";
import { faqItems } from "../constants/constants";

export default function Faqs() {

    return (
        <section className="  flex justify-center mb-20 " id="faqs">
            <div className=" lg:w-9/12 w-10/12  flex flex-col gap-10">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl dark:text-white text-black">
                        Frequently Asked Questions
                    </h2>
                    <p className="mt-4 dark:text-white text-neutral-500">
                        Everything about Rebase.
                    </p>
                </div>
                <div>
                    <Accordion type="single" collapsible className="w-full space-y-2">
                        {faqItems.map((item) => (
                            <AccordionItem
                                key={item.id}
                                value={item.id}
                                className="bg-background shadow-xs rounded-lg border px-4 last:border-b"
                            >
                                <AccordionTrigger className="cursor-pointer items-center py-5 hover:no-underline">
                                    <div className="flex items-center gap-3 dark:text-white text-black">
                                        <div className="flex size-6">
                                            <DynamicIcon name={item.icon} className="m-auto size-4" />
                                        </div>
                                        <span className="text-base">{item.question}</span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-5">
                                    <div className="px-9">
                                        <p className="text-base dark:text-neutral-400  text-neutral-500">
                                            {item.answer}
                                        </p>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    );
}
