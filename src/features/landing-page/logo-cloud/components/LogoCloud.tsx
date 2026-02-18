
import { ProgressiveBlur } from "./progressive-blur";
import { InfiniteSlider } from "./infinite-slider";
import { techStack } from "../constants/constants";
export default function LogoCloud() {
   
    return (
        <section className="bg-background pb-16 pt-16 md:pb-32">
            <div className="bg-background overflow-hidden py-16">
                <div className="group relative m-auto max-w-7xl px-6">
                    <div className="flex flex-col items-center md:flex-row">
                        <div className="md:max-w-44 md:border-r md:pr-6">
                            <p className="text-end text-sm dark:text-white text-black">
                                Powering with the best tech
                            </p>
                        </div>
                        <div className="relative py-6 md:w-[calc(100%-11rem)]">
                            <InfiniteSlider speedOnHover={20} speed={40} gap={112}>
                                {techStack.map((tech, index) => (
                                    <div
                                        className="flex flex-col items-center justify-center px-6"
                                        key={index}
                                    >
                                        {tech.logo()}
                                        <span className="text-sm mt-2 ">{tech.name}</span>
                                    </div>
                                ))}
                            </InfiniteSlider>

                            <div className="bg-linear-to-r from-background absolute inset-y-0 left-0 w-20"></div>
                            <div className="bg-linear-to-l from-background absolute inset-y-0 right-0 w-20"></div>
                            <ProgressiveBlur
                                className="pointer-events-none absolute left-0 top-0 h-full w-20"
                                direction="left"
                                blurIntensity={1}
                            />
                            <ProgressiveBlur
                                className="pointer-events-none absolute right-0 top-0 h-full w-20"
                                direction="right"
                                blurIntensity={1}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
