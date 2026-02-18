"use client"
import { Button } from '@/core/components/ui/button'
import React, { useState } from 'react'

const plans = [
    {
        name: 'Free',
        price: { monthly: 0, yearly: 0 },
        description: 'Perfect for individuals exploring the platform.',
        highlight: false,
        badge: null,
        color: 'from-neutral-700 to-neutral-900',
        borderColor: 'border-slate-200',
        accentColor: 'bg-slate-900',
        textAccent: 'text-slate-900',
        features: [
            { label: '1 Organization', included: true },
            { label: '1 Project', included: true },
            { label: 'Up to 3 team members', included: true },
            { label: 'Basic task management', included: true },
            { label: 'Community support', included: true },
            { label: 'Custom workflows', included: false },
            { label: 'Advanced analytics', included: false },
            { label: 'Priority support', included: false },
            { label: 'API access', included: false },
        ],
        cta: 'Get Started Free',
        ctaStyle: 'bg-slate-900 text-white hover:bg-slate-700',
    },
    {
        name: 'Intermediate',
        price: { monthly: 19, yearly: 15 },
        description: 'For growing teams managing multiple projects.',
        highlight: true,
        badge: 'Most Popular',
        color: 'from-violet-600 to-indigo-600',
        borderColor: 'border-violet-400',
        accentColor: 'bg-white',
        textAccent: 'text-white',
        features: [
            { label: '5 Organizations', included: true },
            { label: 'Up to 20 Projects', included: true },
            { label: 'Up to 25 team members', included: true },
            { label: 'Advanced task management', included: true },
            { label: 'Email support', included: true },
            { label: 'Custom workflows', included: true },
            { label: 'Advanced analytics', included: true },
            { label: 'Priority support', included: false },
            { label: 'API access', included: false },
        ],
        cta: 'Start Free Trial',
        ctaStyle: 'bg-white text-violet-700 hover:bg-violet-50 font-semibold',
    },
    {
        name: 'Premium',
        price: { monthly: 49, yearly: 39 },
        description: 'For enterprises needing full power and control.',
        highlight: false,
        badge: 'Best Value',
        color: 'from-amber-50 to-orange-50',
        borderColor: 'border-amber-300',
        accentColor: 'bg-amber-500',
        textAccent: 'text-amber-600',
        features: [
            { label: 'Unlimited Organizations', included: true },
            { label: 'Unlimited Projects', included: true },
            { label: 'Unlimited team members', included: true },
            { label: 'Enterprise task management', included: true },
            { label: '24/7 dedicated support', included: true },
            { label: 'Custom workflows', included: true },
            { label: 'Advanced analytics & reporting', included: true },
            { label: 'Priority support', included: true },
            { label: 'Full API access', included: true },
        ],
        cta: 'Go Premium',
        ctaStyle: 'bg-amber-500 text-white hover:bg-amber-600 font-semibold',
    },
]

const CheckIcon = ({ filled }: { filled: boolean }) => (
    <svg
        className={`w-4 h-4 shrink-0 ${filled ? 'text-emerald-500' : 'text-slate-300'}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2.5}
    >
        {filled ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        )}
    </svg>
)

const Pricing = () => {
    const [billing, setBilling] = useState('monthly')

    return (
        <section className="min-h-screen  py-24 px-4 " id='pricing'>
            {/* Header */}
            <div className="max-w-3xl mx-auto text-center mb-16">
                <h2
                    className="text-3xl md:text-5xl font-semibold  leading-tight mb-5"
                >Pricing
                </h2>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                    Start free. Scale as your team grows. No hidden fees, no surprises.
                </p>

                {/* Billing toggle */}
                <div className="inline-flex items-center gap-3 mt-8 bg-slate-100 rounded-full p-1">
                    <button
                        onClick={() => setBilling('monthly')}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billing === 'monthly'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBilling('yearly')}
                        className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2 ${billing === 'yearly'
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        Yearly
                        <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                            Save 20%
                        </span>
                    </button>
                </div>
            </div>

            {/* Cards */}
            <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {plans.map((plan) => (
                    <div
                        key={plan.name}
                        className={`relative rounded-2xl border-2 transition-all duration-300 flex flex-col ${plan.highlight
                            ? `bg-gradient-to-br ${plan.color} ${plan.borderColor} shadow-2xl shadow-violet-200 scale-105`
                            : `bg-neutral-900 border shadow-sm hover:shadow-md`
                            }`}
                    >
                        {/* Badge */}
                        {plan.badge && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                                <span
                                    className={`text-xs font-bold tracking-wide uppercase px-3 py-1 rounded-full whitespace-nowrap ${plan.highlight
                                        ? 'bg-white text-violet-700'
                                        : 'bg-amber-500 text-white'
                                        }`}
                                >
                                    {plan.badge}
                                </span>
                            </div>
                        )}

                        <div className="p-7 flex flex-col flex-1">
                            {/* Plan name & description */}
                            <div className="mb-6">
                                <h3
                                    className={`text-xl font-bold mb-1 ${plan.highlight ? 'text-white' : ''}`}
                                >
                                    {plan.name}
                                </h3>
                                <p className={`text-sm  ${plan.highlight ? 'text-violet-200' : 'text-muted-foreground'}`}>
                                    {plan.description}
                                </p>
                            </div>

                            {/* Price */}
                            <div className="mb-7">
                                <div className="flex items-end gap-1">
                                    <span
                                        className={`text-5xl font-extrabold leading-none ${plan.highlight ? 'text-white' : ''}`}
                                        style={{ fontFamily: "'Outfit', sans-serif" }}
                                    >
                                        ${billing === 'yearly' ? plan.price.yearly : plan.price.monthly}
                                    </span>
                                    {plan.price.monthly > 0 && (
                                        <span className={`text-sm mb-1.5 ${plan.highlight ? 'text-violet-200' : 'text-slate-400'}`}>
                                            /mo
                                        </span>
                                    )}
                                </div>
                                {plan.price.monthly === 0 && (
                                    <p className={`text-sm mt-1 ${plan.highlight ? 'text-violet-200' : 'text-slate-400'}`}>
                                        Free forever
                                    </p>
                                )}
                                {plan.price.monthly > 0 && billing === 'yearly' && (
                                    <p className={`text-xs mt-1 ${plan.highlight ? 'text-violet-200' : 'text-slate-400'}`}>
                                        Billed ${plan.price.yearly * 12}/year
                                    </p>
                                )}
                            </div>

                            {/* CTA */}
                            <Button
                                className={`w-full py-3 px-5  text-sm font-semibold transition-all duration-200 mb-7  rounded-sm`}
                            >
                                {plan.cta}
                            </Button>

                            {/* Divider */}
                            <div className={`border-t mb-6 ${plan.highlight ? 'border-white/20' : 'border-slate-100'}`} />

                            {/* Features */}
                            <ul className="space-y-3 flex-1">
                                {plan.features.map((feature) => (
                                    <li key={feature.label} className="flex items-center gap-3">
                                        <CheckIcon filled={feature.included} />
                                        <span
                                            className={`text-sm ${feature.included
                                                ? plan.highlight
                                                    ? 'text-white'
                                                    : ''
                                                : 'text-muted-foreground line-through'
                                                }`}
                                        >
                                            {feature.label}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default Pricing