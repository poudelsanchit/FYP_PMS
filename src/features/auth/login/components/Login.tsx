'use client'
import { Button } from "@/core/components/ui/button"
import { signIn } from "next-auth/react"
import { FcGoogle } from "react-icons/fc"
import { FaGithub } from "react-icons/fa"

const Login = () => {
    return (
        <div className="flex h-screen bg-black text-white">
            {/* Left panel - branding */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 border-r border-white/10 relative overflow-hidden">
                {/* Subtle grid background */}
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage: `linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)`,
                        backgroundSize: '40px 40px',
                    }}
                />

                {/* Logo */}
                <div className="relative z-10">
                    <span className="text-2xl font-bold tracking-tight">Rebase</span>
                </div>

                {/* Quote / description */}
                <div className="relative z-10 space-y-4">
                    <p className="text-3xl font-semibold leading-snug text-white/90">
                        Modern solutions for<br />Tasks Management.
                    </p>
                    <p className="text-sm text-white/40 leading-relaxed max-w-xs">
                        A powerful change management app built for software teams. Adapt to changes, collaborate, and execute.
                    </p>
                </div>

                {/* Bottom note */}
                <p className="relative z-10 text-xs text-white/20">
                    © 2025 Rebase. All rights reserved.
                </p>
            </div>

            {/* Right panel - login form */}
            <div className="flex flex-col justify-center items-center w-full lg:w-1/2 px-6">
                <div className="w-full max-w-sm space-y-8">
                    {/* Header */}
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
                        <p className="text-sm text-white/40">Sign in to your Rebase account</p>
                    </div>

                    {/* Auth buttons */}
                    <div className="space-y-3">
                        <Button
                            variant="outline"
                            className="w-full h-11 bg-transparent border-white/15 text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 flex items-center gap-3 text-sm font-medium"
                            onClick={() => signIn('google')}
                        >
                            <FcGoogle className="w-4 h-4 flex-shrink-0" />
                            Continue with Google
                        </Button>

                        <Button
                            variant="outline"
                            className="w-full h-11 bg-transparent border-white/15 text-white hover:bg-white/5 hover:border-white/30 transition-all duration-200 flex items-center gap-3 text-sm font-medium"
                            onClick={() => signIn('github')}
                        >
                            <FaGithub className="w-4 h-4 flex-shrink-0 text-white" />
                            Continue with GitHub
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="flex items-center gap-3">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-xs text-white/25 uppercase tracking-widest">or</span>
                        <div className="flex-1 h-px bg-white/10" />
                    </div>

                    {/* Email placeholder (non-functional, visual only) */}
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <label className="text-xs text-white/40 uppercase tracking-wider">Email</label>
                            <input
                                type="email"
                                placeholder="you@company.com"
                                className="w-full h-11 rounded-md bg-white/5 border border-white/10 px-3 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/8 transition-all duration-200"
                            />
                        </div>
                        <Button
                            className="w-full h-11 bg-white text-black hover:bg-white/90 text-sm font-semibold transition-all duration-200"
                        >
                            Continue with Email
                        </Button>
                    </div>

                    {/* Terms */}
                    <p className="text-xs text-white/20 text-center leading-relaxed">
                        By continuing, you agree to our{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-white/40 transition-colors">Terms</span>
                        {' '}and{' '}
                        <span className="underline underline-offset-2 cursor-pointer hover:text-white/40 transition-colors">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Login