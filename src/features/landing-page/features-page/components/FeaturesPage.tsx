import { features } from "../constants/constants";

export default function FeaturesPage() {
    return (
        <section className="  flex justify-center mb-32" id="features">
            <div className=" lg:w-9/12 w-10/12  flex flex-col gap-10">
                <div className="text-center">
                    <h2 className="text-balance text-4xl font-medium lg:text-5xl dark:text-white text-black">
                        Built to cover your needs
                    </h2>
                    <p className="mt-4 dark:text-white text-neutral-500">
                        Work smarter in every way.
                    </p>
                </div>
                <div className="relative mx-auto grid max-w-360 divide-x divide-y border *:p-7 sm:grid-cols-2 lg:grid-cols-3">
                    {features.map(({ icon: Icon, title, description }, index) => (
                        <div key={index} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <div>{Icon}</div>
                                <h3 className="text-base font-medium dark:text-white text-black">
                                    {title}
                                </h3>
                            </div>
                            <p className="text-sm text-neutral-500 font-medium">
                                {description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
