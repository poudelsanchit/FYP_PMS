// src/features/billing/components/UpgradePlanDialog.tsx
"use client";

import { useState } from "react";
import { PLANS, type PlanId } from "../lib/plans";
import { Button } from "@/core/components/ui/button";
import { Badge } from "@/core/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/components/ui/dialog";
import {
  Check,
  Zap,
  Building2,
  Crown,
  Loader2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { useBilling } from "../hooks/useBilling";

interface UpgradePlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  currentPlan?: PlanId;
}

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
        relative flex flex-col rounded-xl border p-5 transition-all duration-200
        ${
          plan.highlighted
            ? "border-primary bg-primary/5 shadow-md"
            : "border-border bg-card hover:border-primary/30"
        }
        ${isCurrent ? "ring-2 ring-primary" : ""}
      `}
    >
      {/* Popular badge */}
      {plan.highlighted && (
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-2.5 py-0.5 text-[10px] font-semibold">
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            Most Popular
          </Badge>
        </div>
      )}

      {/* Current plan badge */}
      {isCurrent && (
        <div className="absolute top-3 right-3">
          <Badge
            variant="outline"
            className="text-[10px] border-primary/40 text-primary px-2 py-0"
          >
            Current
          </Badge>
        </div>
      )}

      {/* Plan header */}
      <div className="flex items-center gap-2.5 mb-3">
        <div
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center
            ${plan.highlighted ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}
          `}
        >
          <PlanIcon className="w-4 h-4" />
        </div>
        <div>
          <h3 className="font-semibold text-sm">{plan.name}</h3>
          <p className="text-[11px] text-muted-foreground line-clamp-1">
            {plan.description}
          </p>
        </div>
      </div>

      {/* Price */}
      <div className="mb-4">
        {price === 0 ? (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">Free</span>
            <span className="text-xs text-muted-foreground">forever</span>
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold">${price}</span>
            <span className="text-xs text-muted-foreground">
              /{billingCycle === "yearly" ? "year" : "month"}
            </span>
          </div>
        )}
        {billingCycle === "yearly" && price > 0 && (
          <p className="text-[10px] text-green-600 dark:text-green-400 mt-1">
            Save ${(PLANS[planId].price.monthly * 12 - price).toFixed(0)} vs
            monthly
          </p>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-4 flex-1">
        {plan.features.slice(0, 5).map((feature) => (
          <li key={feature} className="flex items-start gap-1.5 text-xs">
            <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
        {plan.features.length > 5 && (
          <li className="text-[11px] text-muted-foreground pl-5">
            +{plan.features.length - 5} more features
          </li>
        )}
      </ul>

      {/* CTA */}
      <Button
        className="w-full gap-2 h-9 text-sm"
        variant={
          plan.highlighted ? "default" : isCurrent ? "outline" : "outline"
        }
        disabled={
          isCurrent ||
          isRedirecting ||
          (planId === "FREE" && currentPlanId !== "FREE")
        }
        onClick={() => onSelect(planId)}
      >
        {isRedirecting ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Redirecting...
          </>
        ) : isCurrent ? (
          "Current Plan"
        ) : planId === "FREE" ? (
          "Downgrade"
        ) : isDowngrade ? (
          <>
            Downgrade <ArrowRight className="w-3 h-3" />
          </>
        ) : (
          <>
            Upgrade <ArrowRight className="w-3 h-3" />
          </>
        )}
      </Button>
    </div>
  );
}

export function UpgradePlanDialog({
  open,
  onOpenChange,
  orgId,
  currentPlan = "FREE",
}: UpgradePlanDialogProps) {
  const { isRedirecting, startCheckout, openPortal } = useBilling(orgId);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">(
    "monthly"
  );

  function handleSelectPlan(planId: PlanId) {
    if (planId === "FREE") {
      openPortal(); // downgrade via portal
      return;
    }
    startCheckout(planId, billingCycle);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Upgrade Your Plan</DialogTitle>
          <DialogDescription>
            Choose a plan that fits your team's needs
          </DialogDescription>
        </DialogHeader>

        {/* Billing cycle toggle */}
        <div className="flex items-center justify-center mb-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(["FREE", "PREMIUM", "ENTERPRISE"] as PlanId[]).map((planId) => (
            <PlanCard
              key={planId}
              planId={planId}
              currentPlanId={currentPlan}
              billingCycle={billingCycle}
              onSelect={handleSelectPlan}
              isRedirecting={isRedirecting}
            />
          ))}
        </div>

        {/* Footer note */}
        <p className="text-xs text-center text-muted-foreground mt-2">
          All plans include a 14-day free trial. Cancel anytime.
        </p>
      </DialogContent>
    </Dialog>
  );
}
