'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@executive-match/ui';
import { Sparkles, CheckCircle2, RefreshCw } from 'lucide-react';

export interface CompetencyAxis {
  label: string;
  value: number; // 0 - 100
  benchMark: number; // Requisition benchmark 0 - 100
  evidence: string;
}

interface TalentRadar3DProps {
  candidateName?: string;
  roleTitle?: string;
  initialCompetencies?: CompetencyAxis[];
}

const defaultCompetencies: CompetencyAxis[] = [
  {
    label: 'Systems Architecture',
    value: 95,
    benchMark: 85,
    evidence: 'Designed multi-region distributed streaming platform serving 2M req/sec',
  },
  {
    label: 'Org Leadership',
    value: 92,
    benchMark: 80,
    evidence: 'Scaled engineering department from 15 to 85 engineers across 4 squads',
  },
  {
    label: 'Technical Depth',
    value: 90,
    benchMark: 85,
    evidence: 'Deep Golang, Rust, PostgreSQL internals and Linux kernel profiling',
  },
  {
    label: 'Execution Velocity',
    value: 88,
    benchMark: 75,
    evidence: 'Reduced sprint cycle time by 42% via automated CI and preview environments',
  },
  {
    label: 'Strategic Alignment',
    value: 94,
    benchMark: 85,
    evidence: 'Partnered with C-suite to launch enterprise tier adding $18M ARR',
  },
  {
    label: 'Domain Depth',
    value: 86,
    benchMark: 70,
    evidence: 'Financial infrastructure, SOC2 Type II, and PCI-DSS Level 1 audit completion',
  },
];

export function TalentRadar3D({
  candidateName = 'Alex Vance',
  roleTitle = 'VP of Engineering',
  initialCompetencies = defaultCompetencies,
}: TalentRadar3DProps) {
  const [competencies, setCompetencies] = useState<CompetencyAxis[]>(initialCompetencies);
  const [hoveredAxis, setHoveredAxis] = useState<CompetencyAxis | null>(null);
  const [showBenchmark, setShowBenchmark] = useState(true);

  // Geometry calculations
  const size = 320;
  const center = size / 2;
  const radius = size * 0.38;
  const numAxes = competencies.length;
  const angleStep = (Math.PI * 2) / numAxes;

  // Compute point for a given axis and radius fraction (0 to 1)
  const getCoordinates = (index: number, fraction: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const x = center + radius * fraction * Math.cos(angle);
    const y = center + radius * fraction * Math.sin(angle);
    return { x, y };
  };

  // Build polygon path string from values
  const candidatePoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(i, c.value / 100);
      return `${x},${y}`;
    })
    .join(' ');

  const benchmarkPoints = competencies
    .map((c, i) => {
      const { x, y } = getCoordinates(i, c.benchMark / 100);
      return `${x},${y}`;
    })
    .join(' ');

  const averageScore = Math.round(
    competencies.reduce((acc, c) => acc + c.value, 0) / competencies.length,
  );

  return (
    <div className="card-3d p-6 sm:p-7 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              Executive Competency Radar
            </h3>
            <Badge variant="success" className="text-xs">
              {averageScore}% Overall Fit
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Calibrated profile for <strong className="text-foreground">{candidateName}</strong> • {roleTitle}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowBenchmark(!showBenchmark)}
            className={`px-3 py-1 text-xs rounded-lg font-semibold transition-all border ${
              showBenchmark
                ? 'bg-primary/10 border-primary/30 text-primary'
                : 'bg-muted border-border text-muted-foreground'
            }`}
          >
            {showBenchmark ? 'Hide Benchmark' : 'Show Benchmark'}
          </button>
          <button
            type="button"
            onClick={() => setCompetencies([...initialCompetencies])}
            className="p-1.5 rounded-lg border border-border bg-background hover:bg-muted text-muted-foreground transition-colors"
            title="Reset telemetry"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Interactive 3D SVG Radar */}
        <div className="lg:col-span-7 flex justify-center relative">
          <svg
            width={size}
            height={size}
            className="overflow-visible select-none drop-shadow-md"
            viewBox={`0 0 ${size} ${size}`}
          >
            {/* Concentric rings (20%, 40%, 60%, 80%, 100%) */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((level) => {
              const ringPoints = Array.from({ length: numAxes })
                .map((_, i) => {
                  const { x, y } = getCoordinates(i, level);
                  return `${x},${y}`;
                })
                .join(' ');
              return (
                <polygon
                  key={level}
                  points={ringPoints}
                  fill="none"
                  stroke="currentColor"
                  strokeDasharray={level < 1 ? '3 3' : 'none'}
                  className="text-border/80"
                  strokeWidth="1"
                />
              );
            })}

            {/* Radial axis lines */}
            {competencies.map((_, i) => {
              const { x, y } = getCoordinates(i, 1.0);
              return (
                <line
                  key={i}
                  x1={center}
                  y1={center}
                  x2={x}
                  y2={y}
                  stroke="currentColor"
                  className="text-border/80"
                  strokeWidth="1"
                />
              );
            })}

            {/* Requisition Benchmark Polygon (Dashed amber) */}
            {showBenchmark && (
              <motion.polygon
                points={benchmarkPoints}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 0.6 }}
                fill="rgba(245, 158, 11, 0.12)"
                stroke="#f59e0b"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
            )}

            {/* Candidate Actual Polygon (Glowing emerald) */}
            <motion.polygon
              points={candidatePoints}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.85 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              style={{ transformOrigin: `${center}px ${center}px` }}
              fill="rgba(16, 185, 129, 0.2)"
              stroke="#10b981"
              strokeWidth="2.5"
            />

            {/* Interactive Data Vertex Nodes */}
            {competencies.map((c, i) => {
              const { x, y } = getCoordinates(i, c.value / 100);
              const isSelected = hoveredAxis?.label === c.label;

              return (
                <g key={c.label}>
                  <motion.circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : 4}
                    className="cursor-pointer fill-emerald-500 stroke-background stroke-2 shadow-sm"
                    whileHover={{ scale: 1.6 }}
                    onMouseEnter={() => setHoveredAxis(c)}
                  />
                </g>
              );
            })}

            {/* Outer Labels */}
            {competencies.map((c, i) => {
              const { x, y } = getCoordinates(i, 1.2);
              const isSelected = hoveredAxis?.label === c.label;

              return (
                <text
                  key={c.label}
                  x={x}
                  y={y}
                  textAnchor="middle"
                  dominantBaseline="central"
                  className={`text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected ? 'fill-primary font-black scale-105' : 'fill-muted-foreground'
                  }`}
                  onMouseEnter={() => setHoveredAxis(c)}
                >
                  {c.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Dynamic Metric Details & Evidence Card */}
        <div className="lg:col-span-5 space-y-3">
          <div className="p-4 rounded-xl bg-muted/40 border border-border space-y-2">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
              {hoveredAxis ? 'Inspected Competency' : 'Primary Dimension'}
            </span>
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-foreground">
                {hoveredAxis ? hoveredAxis.label : competencies[0]?.label}
              </h4>
              <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {hoveredAxis ? hoveredAxis.value : competencies[0]?.value}%
              </span>
            </div>
            <p className="text-xs text-foreground/90 leading-relaxed pt-1">
              {hoveredAxis ? hoveredAxis.evidence : competencies[0]?.evidence}
            </p>

            <div className="pt-2 border-t border-border flex items-center justify-between text-[11px] text-muted-foreground">
              <span>Requisition Target:</span>
              <strong className="text-foreground">
                {hoveredAxis ? hoveredAxis.benchMark : competencies[0]?.benchMark}%
              </strong>
            </div>
          </div>

          {/* Quick Axis Toggles */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Dimension Telemetry
            </span>
            <div className="grid grid-cols-2 gap-2">
              {competencies.map((c) => (
                <button
                  key={c.label}
                  type="button"
                  onClick={() => setHoveredAxis(c)}
                  className={`p-2 rounded-lg text-left text-xs border transition-all flex items-center justify-between ${
                    hoveredAxis?.label === c.label
                      ? 'bg-primary/10 border-primary text-primary font-bold shadow-sm'
                      : 'bg-card border-border hover:border-primary/40 text-foreground'
                  }`}
                >
                  <span className="truncate pr-1">{c.label}</span>
                  <span className="font-mono text-[11px] text-emerald-500 font-bold shrink-0">
                    {c.value}%
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="text-foreground font-medium">Candidate Profile</span>
          </div>
          {showBenchmark && (
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-t-2 border-dashed border-amber-500 inline-block" />
              <span>Requisition Target</span>
            </div>
          )}
        </div>
        <span className="flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>Calibrated against 1536-dimensional embeddings</span>
        </span>
      </div>
    </div>
  );
}
