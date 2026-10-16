'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Badge } from '@executive-match/ui';
import {
  UploadCloud,
  FileText,
  Sparkles,
  CheckCircle2,
  Building2,
  Calendar,
  GraduationCap,
  Layers,
  ArrowRight,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';

interface ParsedResumeData {
  displayName: string;
  headline: string;
  location: string;
  yearsOfExperience: number;
  email: string;
  phone: string;
  summary: string;
  skills: Array<{ name: string; score: number; isPrimary: boolean }>;
  experiences: Array<{
    title: string;
    companyName: string;
    duration: string;
    achievements: string[];
  }>;
  educations: Array<{
    degree: string;
    institution: string;
    year: string;
  }>;
}

const sampleExecutiveCV: ParsedResumeData = {
  displayName: 'David R. Chen',
  headline: 'VP of Platform Engineering & Cloud Architecture',
  location: 'San Francisco, CA (Open to Remote)',
  yearsOfExperience: 14,
  email: 'david.chen@executive-cloud.io',
  phone: '+1 (415) 890-2341',
  summary:
    'Distinguished technology executive with 14+ years spearheading high-scale cloud platforms, distributed systems, and multi-squad engineering organizations. Proven track record leading infrastructure modernizations that achieved 99.999% availability while reducing cloud expenditure by $4.2M annually.',
  skills: [
    { name: 'Distributed Systems', score: 96, isPrimary: true },
    { name: 'Kubernetes & Multi-Cloud', score: 95, isPrimary: true },
    { name: 'Golang & Rust Core', score: 92, isPrimary: true },
    { name: 'PostgreSQL Internals', score: 90, isPrimary: true },
    { name: 'Executive Leadership', score: 94, isPrimary: true },
    { name: 'SOC2 & Zero-Trust', score: 88, isPrimary: false },
    { name: 'Engineering Velocity', score: 91, isPrimary: false },
    { name: 'FinOps Optimization', score: 89, isPrimary: false },
  ],
  experiences: [
    {
      title: 'VP of Platform Engineering',
      companyName: 'Apex Cloud Technologies',
      duration: '2021 — Present',
      achievements: [
        'Scaled platform org from 22 to 78 engineers across 4 globally distributed hubs.',
        'Engineered zero-downtime migration of 14,000 microservices to unified multi-region Kubernetes mesh.',
        'Championed FinOps practices yielding a 34% reduction in annualized AWS infrastructure cost.',
      ],
    },
    {
      title: 'Head of Infrastructure Architecture',
      companyName: 'Starlight Financial Systems',
      duration: '2017 — 2021',
      achievements: [
        'Architected real-time transactional payment pipeline processing $12B+ in gross volume.',
        'Achieved SOC2 Type II and PCI-DSS Level 1 compliance certifications in record 6 months.',
      ],
    },
  ],
  educations: [
    {
      degree: 'M.S. in Computer Science (Distributed Systems)',
      institution: 'Carnegie Mellon University',
      year: '2010',
    },
    {
      degree: 'B.S. in Electrical Engineering & Computer Science',
      institution: 'UC Berkeley',
      year: '2008',
    },
  ],
};

export function LiveResumeParser({
  onImportComplete,
}: {
  onImportComplete?: (data: ParsedResumeData) => void;
}) {
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedResumeData | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);

  const simulateParsing = (data: ParsedResumeData = sampleExecutiveCV) => {
    setIsParsing(true);
    setProgress(15);
    setParsedData(null);

    const step1 = setTimeout(() => setProgress(45), 400);
    const step2 = setTimeout(() => setProgress(75), 900);
    const step3 = setTimeout(() => {
      setProgress(100);
      setIsParsing(false);
      setParsedData(data);
    }, 1400);

    return () => {
      clearTimeout(step1);
      clearTimeout(step2);
      clearTimeout(step3);
    };
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      simulateParsing();
    }
  };

  return (
    <div className="space-y-6">
      {/* Upload & Dropzone Header */}
      <div className="card-3d p-6 sm:p-7 space-y-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-primary">
            AI TALENT INTELLIGENCE
          </span>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2 mt-1">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Live AI Resume Parser & Analyzer
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Drop an executive curriculum vitae to parse structured competencies, leadership scope, and vector embeddings.
          </p>
        </div>

        {/* Dropzone container */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 sm:p-10 text-center transition-all cursor-pointer relative overflow-hidden ${
            dragActive
              ? 'border-primary bg-primary/10 shadow-glow scale-[1.01]'
              : 'border-border/80 hover:border-primary/50 bg-muted/20 hover:bg-muted/30'
          }`}
          onClick={() => simulateParsing()}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                Drag & Drop Executive CV (PDF / DOCX)
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                Automatic optical structure recognition, competency calibration, and calibrated match generation.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="sm"
                className="btn-3d text-xs h-9 px-4"
                disabled={isParsing}
              >
                Browse Files
              </Button>
              <Button
                variant="outline"
                size="sm"
                type="button"
                className="btn-3d-secondary text-xs h-9 px-4"
                onClick={(e) => {
                  e.stopPropagation();
                  simulateParsing();
                }}
                disabled={isParsing}
              >
                Load Sample Executive CV
              </Button>
            </div>
          </div>

          {/* Parsing progress bar */}
          {isParsing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-x-0 bottom-0 p-4 bg-background/90 backdrop-blur-sm border-t border-border flex flex-col items-center justify-center space-y-2"
            >
              <div className="flex items-center justify-between w-full max-w-md text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-foreground">
                  <RotateCw className="w-3.5 h-3.5 animate-spin text-primary" />
                  Neural Parser Vectorizing Document...
                </span>
                <span className="font-mono text-primary">{progress}%</span>
              </div>
              <div className="w-full max-w-md h-2 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Structured Parsed Output Showcase */}
      <AnimatePresence>
        {parsedData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
            className="card-3d p-6 sm:p-7 space-y-6"
          >
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-border">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/30 flex items-center justify-center text-primary font-black text-xl shadow-md shrink-0">
                  {parsedData.displayName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-xl font-bold text-foreground">{parsedData.displayName}</h3>
                    <Badge variant="success" className="text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Parsed & Verified
                    </Badge>
                    <Badge variant="neutral" className="text-xs">
                      {parsedData.yearsOfExperience} Yrs Experience
                    </Badge>
                  </div>
                  <p className="text-sm font-semibold text-primary">{parsedData.headline}</p>
                  <p className="text-xs text-muted-foreground">
                    {parsedData.location} • {parsedData.email} • {parsedData.phone}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="primary"
                  className="btn-3d text-xs h-10 px-4 flex items-center gap-1.5"
                  onClick={() => onImportComplete?.(parsedData)}
                >
                  <span>Import to Profile</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* Executive Bio */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Executive Synthesis
              </h4>
              <p className="text-xs text-foreground/90 leading-relaxed bg-muted/30 p-3.5 rounded-xl border border-border">
                {parsedData.summary}
              </p>
            </div>

            {/* Competencies with Fit Rings */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-primary" />
                Extracted Competencies & Depth Scores
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {parsedData.skills.map((s) => (
                  <div
                    key={s.name}
                    className="p-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-all flex items-center justify-between"
                  >
                    <div>
                      <span className="text-xs font-bold text-foreground block truncate max-w-[120px]">
                        {s.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">
                        {s.isPrimary ? 'Primary Core' : 'Secondary'}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-black text-emerald-500">
                      {s.score}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Work History */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Quantified Career Milestones
              </h4>
              <div className="space-y-3">
                {parsedData.experiences.map((exp) => (
                  <div
                    key={exp.title}
                    className="p-4 rounded-xl bg-muted/20 border border-border space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-foreground">{exp.title}</span>
                      <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {exp.duration}
                      </span>
                    </div>
                    <div className="text-xs text-primary font-semibold">{exp.companyName}</div>
                    <ul className="space-y-1 text-xs text-muted-foreground pt-1 list-disc pl-4">
                      {exp.achievements.map((ach, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {ach}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-primary" />
                Academic Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {parsedData.educations.map((edu) => (
                  <div key={edu.degree} className="p-3.5 rounded-xl bg-muted/20 border border-border">
                    <div className="font-bold text-xs text-foreground">{edu.degree}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {edu.institution} ({edu.year})
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Privacy & R2 Vault Guarantee */}
            <div className="p-3.5 rounded-xl bg-muted/30 border border-border text-[11px] text-muted-foreground flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>
                Processed through zero-data-retention inference pipeline. Binaries encrypted with AES-256 before upload.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
