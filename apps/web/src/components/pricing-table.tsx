'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Sparkles,
  Zap,
  Building,
  ArrowRight,
  ShieldCheck,
  Bot,
  Users,
} from 'lucide-react';
import { Button } from '@executive-match/ui';

interface PricingTier {
  id: string;
  name: string;
  badge?: string;
  description: string;
  monthlyPrice: number | string;
  annualPrice: number | string;
  icon: React.ReactNode;
  popular?: boolean;
  features: string[];
  specs: {
    jobs: string;
    searches: string;
    members: string;
  };
  ctaText: string;
  ctaHref: string;
  variant: 'outline' | 'primary' | 'secondary';
}

const TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter Workspace',
    badge: 'Early Access',
    description: 'For boutique agencies and early-stage companies making critical senior hires.',
    monthlyPrice: 0,
    annualPrice: 0,
    icon: <Zap className="w-5 h-5 text-emerald-600" />,
    specs: {
      jobs: 'Up to 3 Active Jobs',
      searches: '50 Candidate Searches/mo',
      members: '2 Team Members',
    },
    features: [
      '1 Company Workspace',
      'Structured Candidate Evidence Cards',
      'Standard ATS Kanban Pipeline Stages',
      'Cryptographic Tenant Database Isolation',
      'Email Notifications for Applicant Submissions',
    ],
    ctaText: 'Start with Preview',
    ctaHref: '/register',
    variant: 'outline',
  },
  {
    id: 'growth',
    name: 'Growth Team',
    badge: 'Recommended',
    popular: true,
    description: 'For scaling engineering organizations hiring across multiple technical teams.',
    monthlyPrice: 249,
    annualPrice: 199,
    icon: <Sparkles className="w-5 h-5 text-white" />,
    specs: {
      jobs: 'Unlimited Active Requisitions',
      searches: '1,000 Candidate Searches/mo',
      members: '10 Team Members',
    },
    features: [
      'Unlimited Active Requisitions',
      'Granular RBAC (Owner, Admin, Recruiter, Viewer)',
      'Explainable AI Matching Evidence Breakdown',
      'Collaborative Candidate Notes & Review Rubrics',
      'Resume Intelligence & Skill Taxonomy Normalization',
      'Priority Background Queue Worker Processing',
      'Multi-Format Offer Letter Generator & E-Signatures',
    ],
    ctaText: 'Request Workspace Access',
    ctaHref: '/register',
    variant: 'primary',
  },
  {
    id: 'enterprise',
    name: 'Enterprise Platform',
    badge: 'Custom Governance',
    description: 'For multi-entity organizations requiring dedicated telemetry and custom governance.',
    monthlyPrice: 'Custom',
    annualPrice: 'Custom',
    icon: <Building className="w-5 h-5 text-emerald-700" />,
    specs: {
      jobs: 'Custom Job Volume',
      searches: 'Unlimited Searches',
      members: 'Unlimited Seats',
    },
    features: [
      'Multi-Workspace Centralized Management',
      'Custom Pipeline Stages & Approval Workflows',
      'Dedicated Provider Port & ATS Connectors (Greenhouse, Lever)',
      'Webhooks, Cryptographic API Keys & Audit Log Exports',
      'SOC 2 Compliance Telemetry & Support Elevation SLA',
      'Dedicated Technical Solutions Architect',
    ],
    ctaText: 'Contact Platform Team',
    ctaHref: '/about',
    variant: 'outline',
  },
];

export function PricingTable() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('annual');

  return (
    <div className="w-full">
      {/* Billing Cycle Toggle Pill */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 my-8">
        <div className="inline-flex p-1 rounded-full bg-gray-100/90 border border-gray-200/80 shadow-inner">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-150 ${
              billingCycle === 'monthly'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setBillingCycle('annual')}
            className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-150 flex items-center gap-1.5 ${
              billingCycle === 'annual'
                ? 'bg-emerald-800 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>Annual Billing</span>
            <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.5 rounded-full font-bold">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch pt-2">
        {TIERS.map((tier) => {
          const isAnnual = billingCycle === 'annual';
          const displayPrice =
            typeof tier.monthlyPrice === 'number'
              ? isAnnual
                ? `$${tier.annualPrice}`
                : `$${tier.monthlyPrice}`
              : tier.monthlyPrice;

          return (
            <div
              key={tier.id}
              className={`relative rounded-2xl flex flex-col justify-between transition-all duration-200 ${
                tier.popular
                  ? 'bg-white border-2 border-emerald-600 shadow-2xl scale-[1.03] z-10'
                  : 'bg-white/90 border border-gray-200/90 shadow-md hover:shadow-xl hover:translate-y-[-2px]'
              }`}
              style={{
                boxShadow: tier.popular
                  ? '0 20px 45px -10px rgba(49, 95, 77, 0.22), 0 0 0 1px rgba(49, 95, 77, 0.15), inset 0 1px 0 rgba(255, 255, 255, 1)'
                  : undefined,
              }}
            >
              {/* Popular Crown Badge */}
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[11px] font-extrabold uppercase tracking-wider px-3.5 py-1 rounded-full shadow-md flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-200" />
                  Most Popular
                </div>
              )}

              {/* Tier Header */}
              <div className="p-7 pb-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-xs ${
                        tier.popular ? 'bg-emerald-700 text-white' : 'bg-emerald-50 text-emerald-800'
                      }`}
                    >
                      {tier.icon}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-base text-gray-900 leading-tight">
                        {tier.name}
                      </h3>
                      {tier.badge && (
                        <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wide">
                          {tier.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Price Display */}
                <div className="mt-4 mb-2">
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-extrabold text-gray-900 tracking-tight">
                      {displayPrice}
                    </span>
                    {typeof tier.monthlyPrice === 'number' && (
                      <span className="text-xs text-gray-500 font-medium">
                        / workspace / {isAnnual ? 'mo, billed annually' : 'month'}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed min-h-[38px] mb-5">
                  {tier.description}
                </p>

                {/* Quick Limits Bar */}
                <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100/90 text-xs text-gray-700 space-y-1.5 font-medium">
                  <div className="flex items-center gap-2">
                    <Bot className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{tier.specs.jobs}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{tier.specs.members}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{tier.specs.searches}</span>
                  </div>
                </div>

                {/* Features List */}
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-3">
                    Included Capabilities
                  </div>
                  <ul className="space-y-2.5">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-xs text-gray-700 leading-snug">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-7 pt-2">
                <Link href={tier.ctaHref} className="block w-full">
                  <Button
                    variant={tier.variant}
                    size="lg"
                    className="w-full flex items-center justify-center gap-2 font-bold shadow-sm"
                  >
                    <span>{tier.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
