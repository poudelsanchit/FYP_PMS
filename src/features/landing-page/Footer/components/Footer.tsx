export default function Footer() {
    return (
        <section className="lg:px-20 px-8">
            <div className="w-full flex justify-between  text-secondary-text text-sm pt-6  pb-2 border-t mt-20">
                <div className=" h-32 w-max">
                    <div className="lg:text-3xl md:text-2xl text-xl font-medium font-Poppins gap-4 flex dark:text-white text-black ">
                        Rebase
                    </div>
                    <div className="text-neutral-500 text-xs sm:text-sm">
                        Collaborate, Align Organize, and Execute
                    </div>
                </div>
                <div className=" w-max text-neutral-500 sm:text-sm text-xs ">
                    © 2025 Rebase. All rights reserved
                </div>
            </div>
        </section>
    );
}
