// src/features/billing/hooks/useBilling.ts
"use client";

import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import type { PlanId } from "../lib/plans";
import { PLANS } from "../lib/plans";

interface BillingData {
    plan: PlanId;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: string | null;
    trialEndsAt: string | null;
    planDetails: typeof PLANS[PlanId];
}

export function useBilling(orgId: string) {
    const [billing, setBilling] = useState<BillingData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isRedirecting, setIsRedirecting] = useState(false);

    const fetchBilling = useCallback(async () => {
        if (!orgId) return;
        try {
            setIsLoading(true);
            setError(null);
            const res = await axios.get(`/api/organizations/${orgId}/billing`);
            setBilling(res.data);
        } catch {
            setError("Failed to load billing information");
        } finally {
            setIsLoading(false);
        }
    }, [orgId]);

    useEffect(() => {
        fetchBilling();
    }, [fetchBilling]);

    // Redirect to Stripe Checkout
    const startCheckout = async (planId: PlanId, billingCycle: "monthly" | "yearly") => {
        setIsRedirecting(true);
        try {
            const res = await axios.post(`/api/organizations/${orgId}/billing/checkout`, {
                planId,
                billingCycle,
            });
            // Plan is already updated in database before redirect
            // Redirect to Stripe checkout page
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })
                ?.response?.data?.error;
            setError(msg ?? "Failed to start checkout");
            setIsRedirecting(false);
        }
    };

    // Redirect to Stripe Customer Portal
    const openPortal = async () => {
        setIsRedirecting(true);
        try {
            const res = await axios.post(`/api/organizations/${orgId}/billing/portal`);
            window.location.href = res.data.url;
        } catch (err: unknown) {
            const msg = (err as { response?: { data?: { error?: string } } })
                ?.response?.data?.error;
            setError(msg ?? "Failed to open billing portal");
            setIsRedirecting(false);
        }
    };

    return {
        billing,
        isLoading,
        error,
        isRedirecting,
        startCheckout,
        openPortal,
        refetch: fetchBilling,
    };
}