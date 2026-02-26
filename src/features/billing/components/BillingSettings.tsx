// src/features/billing/components/BillingSettings.tsx
"use client";

import { useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { PLANS, type PlanId } from "../lib/plans";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import { Skeleton } from "@/core/components/ui/skeleton";
import {
    Check, Zap, Building2, Users, ArrowRight,
    ExternalLink, AlertCircle, Crown, Loader2,
} from "lucide-react";
import { format } from "date-fns";
import { useBilling } from "../hooks/useBilling";

// ─── Plan Card ────────────────────────────────────────────────────────────────

function PlanCard({
    planId,
    currentPlanId,
    billingCycle,
    onSelect,
    isRedirecting,
}: {
    planId: PlanId;
    currentPlanId: PlanId;
    billingCycle: "monthly" | "yearly";
    onSelect: (planId: PlanId) => void;
    isRedirecting: boolean;
}) {
    const plan = PLANS[planId];
    const isCurrent = planId === currentPlanId;
    const isDowngrade =
        ["FREE", "PREMIUM", "ENTERPRISE"].indexOf(planId) <
        ["FREE", "PREMIUM", "ENTERPRISE"].indexOf(currentPlanId);

    const price =
        billingCycle === "yearly" ? plan.price.yearly : plan.price.monthly;

    const PlanIcon =
        planId === "FREE" ? Zap : planId === "PREMIUM" ? Crown : Building2;

    return (
        <div
            className={`
                relative flex flex-col rounded-2xl border p-6 transition-all duration-200
                ${plan.highlighted
                    ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                    : "border-border bg-card hover:border-primary/30"
                }
                ${isCurrent ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
            `}
        >
            {/* Popular badge */}
            {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-3 py-0.5 text-xs font-semibold">
                        Most Popular
                    </Badge>
                </div>
            )}

            {/* Current plan badge */}
            {isCurrent && (
                <div className="absolute top-4 right-4">
                    <Badge variant="outline" className="text-xs border-primary/40 text-primary">
                        Current Plan
                    </Badge>
                </div>
            )}

            {/* Plan header */}
            <div className="flex items-center gap-3 mb-4">
                <div className={`
                    w-10 h-10 rounded-xl flex items-center justify-center
                    ${plan.highlighted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}
                `}>
                    <PlanIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-base">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                </div>
            </div>

            {/* Price */}
            <div className="mb-6">
                {price === 0 ? (
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">Free</span>
                        <span className="text-sm text-muted-foreground">forever</span>
                    </div>
                ) : (
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">${price}</span>
                        <span className="text-sm text-muted-foreground">
                            /{billingCycle === "yearly" ? "year" : "month"}
                        </span>
                    </div>
                )}
                {billingCycle === "yearly" && price > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Save ${(PLANS[planId].price.monthly * 12 - price).toFixed(0)} vs monthly
                    </p>
                )}
            </div>

            {/* Features */}
            <ul className="space-y-2.5 mb-6 flex-1">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-muted-foreground">{feature}</span>
                    </li>
                ))}
            </ul>

            {/* CTA */}
            <Button
                className="w-full gap-2"
                variant={plan.highlighted ? "default" : isCurrent ? "outline" : "outline"}
                disabled={isCurrent || isRedirecting || planId === "FREE" && currentPlanId !== "FREE"}
                onClick={() => onSelect(planId)}
            >
                {isRedirecting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
                ) : isCurrent ? (
                    "Current Plan"
                ) : planId === "FREE" ? (
                    "Downgrade to Free"
                ) : isDowngrade ? (
                    <>Downgrade <ArrowRight className="w-3.5 h-3.5" /></>
                ) : (
                    <>Upgrade <ArrowRight className="w-3.5 h-3.5" /></>
                )}
            </Button>
        </div>
    );
}

// ─── Current Subscription Banner ─────────────────────────────────────────────

function SubscriptionBanner({
    billing,
    onOpenPortal,
    isRedirecting,
}: {
    billing: ReturnType<typeof useBilling>["billing"];
    onOpenPortal: () => void;
    isRedirecting: boolean;
}) {
    if (!billing || billing.plan === "FREE") return null;

    const isPastDue = billing.status === "PAST_DUE";
    const isCanceled = billing.cancelAtPeriodEnd;

    return (
        <div className={`
            rounded-xl border px-5 py-4 mb-8 flex items-center justify-between gap-4
            ${isPastDue
                ? "bg-destructive/10 border-destructive/30"
                : isCanceled
                    ? "bg-yellow-500/10 border-yellow-500/30"
                    : "bg-primary/5 border-primary/20"
            }
        `}>
            <div className="flex items-center gap-3">
                {isPastDue && <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0" />}
                <div>
                    <p className="text-sm font-medium">
                        {isPastDue
                            ? "Payment failed — please update your payment method"
                            : isCanceled
                                ? `Plan cancels on ${billing.currentPeriodEnd ? format(new Date(billing.currentPeriodEnd), "MMM d, yyyy") : "end of period"}`
                                : `${PLANS[billing.plan].name} plan · renews ${billing.currentPeriodEnd ? format(new Date(billing.currentPeriodEnd), "MMM d, yyyy") : "soon"}`
                        }
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        Manage payment methods, download invoices, or cancel your plan
                    </p>
                </div>
            </div>
            <Button
                size="sm"
                variant="outline"
                className="flex-shrink-0 gap-2"
                onClick={onOpenPortal}
                disabled={isRedirecting}
            >
                {isRedirecting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                    <ExternalLink className="w-3.5 h-3.5" />
                )}
                Manage Billing
            </Button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function BillingSettings() {
    const params = useParams();
    const searchParams = useSearchParams();
    const orgId = params?.tenantId as string;

    const { billing, isLoading, error, isRedirecting, startCheckout, openPortal } =
        useBilling(orgId);

    const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

    const checkoutSuccess = searchParams.get("billing") === "success";
    const checkoutCanceled = searchParams.get("billing") === "canceled";

    function handleSelectPlan(planId: PlanId) {
        if (planId === "FREE") {
            openPortal(); // downgrade via portal
            return;
        }
        startCheckout(planId, billingCycle);
    }

    return (
        <div className="max-w-5xl">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Billing & Plans</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Manage your organization's plan and payment details
                    </p>
                </div>
                {billing && billing.plan !== "FREE" && (
                    <Badge 
                        variant="outline" 
                        className={`text-sm px-3 py-1 font-medium ${
                            billing.plan === "PREMIUM" 
                                ? "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20"
                                : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20"
                        }`}
                    >
                        {billing.plan === "PREMIUM" ? <Crown className="w-3.5 h-3.5 mr-1" /> : <Building2 className="w-3.5 h-3.5 mr-1" />}
                        Current: {PLANS[billing.plan].name}
                    </Badge>
                )}
            </div>

            {/* Success / cancel flash */}
            {checkoutSuccess && (
                <div className="mb-6 bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400 rounded-xl px-5 py-3 text-sm font-medium flex items-center gap-2">
                    <Check className="w-4 h-4" />
                    Plan upgraded successfully! Your new plan is now active.
                </div>
            )}
            {checkoutCanceled && (
                <div className="mb-6 bg-muted border border-border rounded-xl px-5 py-3 text-sm text-muted-foreground">
                    Checkout canceled — no charges were made.
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-xl px-5 py-3 text-sm text-destructive">
                    {error}
                </div>
            )}

            {/* Current subscription banner */}
            {billing && (
                <SubscriptionBanner
                    billing={billing}
                    onOpenPortal={openPortal}
                    isRedirecting={isRedirecting}
                />
            )}

            {/* Billing cycle toggle */}
            <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-muted-foreground">
                    Choose a plan that fits your team
                </p>
                <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
                    <button
                        onClick={() => setBillingCycle("monthly")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                            billingCycle === "monthly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle("yearly")}
                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                            billingCycle === "yearly"
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        Yearly
                        <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 text-[10px] px-1.5 py-0 border-0">
                            Save 30%
                        </Badge>
                    </button>
                </div>
            </div>

            {/* Plan cards */}
            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-2xl border border-border p-6 space-y-4">
                            <Skeleton className="h-10 w-10 rounded-xl" />
                            <Skeleton className="h-5 w-24" />
                            <Skeleton className="h-10 w-20" />
                            <div className="space-y-2">
                                {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-4 w-full" />)}
                            </div>
                            <Skeleton className="h-10 w-full rounded-lg" />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(["FREE", "PREMIUM", "ENTERPRISE"] as PlanId[]).map((planId) => (
                        <PlanCard
                            key={planId}
                            planId={planId}
                            currentPlanId={billing?.plan ?? "FREE"}
                            billingCycle={billingCycle}
                            onSelect={handleSelectPlan}
                            isRedirecting={isRedirecting}
                        />
                    ))}
                </div>
            )}

            {/* Usage limits */}
            {billing && billing.plan !== "FREE" && (
                <div className="mt-10 rounded-xl border border-border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Users className="w-4 h-4 text-muted-foreground" />
                        <h3 className="text-sm font-medium">Current Plan Limits</h3>
                        <Badge variant="secondary" className="text-xs ml-auto">
                            {PLANS[billing.plan].name}
                        </Badge>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {Object.entries(PLANS[billing.plan].limits).map(([key, value]) => (
                            <div key={key} className="bg-muted/50 rounded-lg px-4 py-3">
                                <p className="text-xs text-muted-foreground capitalize">
                                    {key.replace(/([A-Z])/g, " $1")}
                                </p>
                                <p className="text-lg font-semibold mt-0.5">
                                    {value === -1 ? "∞" : value}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}