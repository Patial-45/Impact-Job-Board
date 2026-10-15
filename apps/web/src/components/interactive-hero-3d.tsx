'use client';

import React, { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BrainCircuit,
  CheckCircle2,
  ShieldCheck,
  Layers,
  Briefcase,
  ChevronRight,
  TrendingUp,
  Cpu,
} from 'lucide-react';
import { LogoMark } from '@executive-match/ui';

interface DemoRole {
  id: string;
  title: string;
  company: string;
  matchScore: number;
  salary: string;
  location: string;
  tags: string[];
  evidence: {
    category: string;
    percentage: number;
    highlight: string;
  }[];
}

const DEMO_ROLES: DemoRole[] = [
  {
    id: 'vp-eng',
    title: 'VP of Engineering',
    company: 'Horizon Cloud Systems',
    matchScore: 96,
    salary: '$260k - $320k',
    location: 'San Francisco, CA (Hybrid)',
    tags: ['Distributed Systems', 'TypeScript', 'Org Leadership', 'Postgres'],
    evidence: [
      { category: 'Architecture & Scalability', percentage: 98, highlight: '10+ yrs scaling distributed event-driven systems' },
      { category: 'Technical Org Leadership', percentage: 96, highlight: 'Managed 45+ engineers across platform & infrastructure' },
      { category: 'Modern Tech Stack Overlap', percentage: 95, highlight: 'Deep production Next.js, NestJS, and Redis expertise' },
      { category: 'Culture & Execution Velocity', percentage: 94, highlight: 'Proven track record leading Series B to C expansion' },
    ],
  },
  {
    id: 'staff-arch',
    title: 'Staff Systems Architect',
    company: 'Nexus Data Platform',
    matchScore: 94,
    salary: '$220k - $270k',
    location: 'Remote · US',
    tags: ['Cloud Infra', 'Kubernetes', 'Go / Node.js', 'High Concurrency'],
    evidence: [
      { category: 'High-Throughput Systems', percentage: 96, highlight: 'Built low-latency ingestion handling 80k req/sec' },
      { category: 'Data Consistency & Modeling', percentage: 94, highlight: 'Relational & vector indexing optimization' },
      { category: 'Distributed Consensus', percentage: 92, highlight: 'Raft, Kafka, and BullMQ queue architecture' },
      { category: 'Domain Scope Alignment', percentage: 93, highlight: '12+ yrs experience across enterprise platforms' },
    ],
  },
  {
    id: 'head-prod',
    title: 'Chief Product Officer',
    company: 'Vanguard Enterprise',
    matchScore: 91,
    salary: '$250k - $310k',
    location: 'New York, NY (Hybrid)',
    tags: ['B2B SaaS', 'Product Strategy', 'Enterprise Sales', 'Roadmapping'],
    evidence: [
      { category: 'Enterprise Product Vision', percentage: 95, highlight: 'Defined multi-product roadmap for $40M ARR SaaS' },
      { category: 'Customer Discovery & Retention', percentage: 92, highlight: 'Reduced enterprise churn by 32% over 2 years' },
      { category: 'Engineering Collaboration', percentage: 89, highlight: 'Close partnership with technical architecture teams' },
      { category: 'Pricing & Monetization', percentage: 88, highlight: 'Architected usage-based tiered subscription model' },
    ],
  },
];

export function InteractiveHero3D() {
  const [selectedRole, setSelectedRole] = useState<DemoRole>(DEMO_ROLES[0]!);
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rotateY = (x / (rect.width / 2)) * 8; // max 8deg
    const rotateX = -(y / (rect.height / 2)) * 8; // max 8deg
    setMouseOffset({ x: rotateY, y: rotateX });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setMouseOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div className="relative w-full max-w-[580px] mx-auto select-none perspective-[1200px]">
      {/* Ambient Radial Background Glow */}
      <div
        className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-600/15 blur-2xl transition-opacity duration-700 pointer-events-none"
        style={{ opacity: isHovered ? 0.9 : 0.55 }}
      />

      {/* Main 3D Card Container */}
      <div
        ref={cardRef}
        onMouseEnter={() => setIsHovered(true)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative rounded-2xl bg-white/90 backdrop-blur-xl border border-white/60 shadow-2xl transition-transform duration-200 ease-out"
        style={{
          transform: `perspective(1000px) rotateX(${mouseOffset.y}deg) rotateY(${mouseOffset.x}deg) translateZ(${isHovered ? 8 : 0}px)`,
          transformStyle: 'preserve-3d',
          boxShadow: isHovered
            ? '0 24px 48px -12px rgba(24, 45, 36, 0.18), 0 0 32px -4px rgba(49, 95, 77, 0.2), inset 0 1px 0 rgba(255, 255, 255, 1)'
            : '0 16px 36px -8px rgba(18, 30, 26, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.95)',
        }}
      >
        {/* Top Floating Badge Bar */}
        <div className="p-5 pb-3 border-b border-gray-100/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-200/60 shadow-sm">
              <LogoMark size="sm" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 tracking-tight">
                <BrainCircuit className="w-3.5 h-3.5 text-emerald-600" />
                EXECUTIVE MATCH ENGINE
              </div>
              <div className="text-[11px] text-gray-500 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Hybrid Evaluation (v2.4)
              </div>
            </div>
          </div>

          {/* Dynamic Match Score Meter */}
          <div className="flex items-center gap-2 bg-emerald-50/80 border border-emerald-200/70 px-3 py-1.5 rounded-xl shadow-inner">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-800">Match Evidence</div>
              <div className="text-base font-extrabold text-emerald-700 tracking-tight leading-none">
                {selectedRole.matchScore}%
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-md">
              <Sparkles className="w-4 h-4 text-emerald-100" />
            </div>
          </div>
        </div>

        {/* Interactive Role Selector Pills */}
        <div className="px-5 pt-3 pb-2">
          <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Select Target Requisition</span>
            <span className="text-emerald-700 font-semibold lowercase">click to preview evidence</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {DEMO_ROLES.map((role) => {
              const active = role.id === selectedRole.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setSelectedRole(role)}
                  className={`text-left p-2.5 rounded-xl border transition-all duration-150 relative overflow-hidden group ${
                    active
                      ? 'bg-emerald-800 text-white border-emerald-900 shadow-md translate-y-[-1px]'
                      : 'bg-gray-50/80 text-gray-700 border-gray-200/80 hover:bg-emerald-50/50 hover:border-emerald-300'
                  }`}
                  style={{
                    transform: active ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <div className="text-[11px] font-bold truncate leading-tight">{role.title}</div>
                  <div
                    className={`text-[10px] mt-0.5 truncate ${
                      active ? 'text-emerald-200' : 'text-gray-500'
                    }`}
                  >
                    {role.matchScore}% Match
                  </div>
                  {active && (
                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-300" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Role Meta Header */}
        <div className="px-5 py-3 bg-gradient-to-r from-gray-50/60 to-emerald-50/30 border-y border-gray-100/90 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              {selectedRole.title}
              <span className="text-gray-400 font-normal">·</span>
              <span className="text-gray-600 text-xs font-normal">{selectedRole.company}</span>
            </div>
            <div className="text-xs text-gray-500 mt-0.5 font-mono">
              {selectedRole.salary} · {selectedRole.location}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {selectedRole.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-semibold bg-white border border-gray-200 text-gray-700 px-2 py-0.5 rounded-md shadow-2xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Evidence Breakdown Alignment Bars */}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-gray-800">
            <span className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-emerald-700" />
              Explainable Competency Alignment
            </span>
            <span className="text-[11px] font-mono text-emerald-700 font-semibold">
              Deterministic + Semantic Cosine
            </span>
          </div>

          <div className="space-y-2.5">
            {selectedRole.evidence.map((item, idx) => (
              <div key={idx} className="bg-gray-50/70 p-2.5 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {item.category}
                  </span>
                  <span className="font-mono font-bold text-emerald-700">{item.percentage}%</span>
                </div>
                {/* Visual Progress Bar */}
                <div className="w-full bg-gray-200/70 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
                <div className="text-[11px] text-gray-500 mt-1 leading-snug">{item.highlight}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Interactive Proof Bar */}
        <div className="p-4 px-5 bg-gray-50/90 rounded-b-2xl border-t border-gray-200/70 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>Cryptographic workspace isolation & explainable audit log</span>
          </div>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 transition-colors group shrink-0"
          >
            <span>Explore Roles</span>
            <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* Floating 3D Accent Pill 1 (Top Left) */}
      <div
        className="hidden sm:flex absolute -top-4 -left-6 bg-white/95 backdrop-blur-md border border-white/80 shadow-lg rounded-xl px-3 py-2 items-center gap-2 text-xs font-bold text-gray-800 transition-transform duration-300"
        style={{
          transform: `translate3d(${mouseOffset.x * -1.5}px, ${mouseOffset.y * -1.5}px, 30px)`,
        }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
        <span>Evidence-Driven Recruitment</span>
      </div>

      {/* Floating 3D Accent Pill 2 (Bottom Right) */}
      <div
        className="hidden sm:flex absolute -bottom-5 -right-6 bg-white/95 backdrop-blur-md border border-white/80 shadow-xl rounded-xl px-3.5 py-2 items-center gap-2 text-xs font-bold text-gray-800 transition-transform duration-300"
        style={{
          transform: `translate3d(${mouseOffset.x * 2}px, ${mouseOffset.y * 2}px, 40px)`,
        }}
      >
        <Layers className="w-4 h-4 text-emerald-600" />
        <span>ATS Kanban + Semantic Search</span>
        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-bold">
          LIVE
        </span>
      </div>
    </div>
  );
}
