import Link from 'next/link';
import {
  Briefcase,
  FileText,
  ArrowUpRight,
  CheckCircle2,
  Sparkles,
  Upload,
  UserCheck,
  GraduationCap,
  Activity,
} from 'lucide-react';
import { getCandidateProfile, getViewer } from '@/lib/api';
import { StatCard, Badge, Button } from '@executive-match/ui';

export default async function CandidateHome() {
  const [profile, viewer] = await Promise.all([
    getCandidateProfile(),
    getViewer(),
  ]);

  const experiences = profile?.experiences || [];
  const educations = profile?.educations || [];
  const skills = profile?.skills || [];
  const resumes = profile?.resumes || [];
  const primaryResume = resumes.find((r) => r.isPrimary) || resumes[0];

  // Calculate profile strength
  const missingSteps: string[] = [];
  let score = 0;

  if (profile?.headline) score += 15;
  else missingSteps.push('Add your professional headline');

  if (profile?.bio) score += 15;
  else missingSteps.push('Add a professional summary / bio');

  if (profile?.location) score += 10;
  else missingSteps.push('Add your location preferences');

  if (experiences.length > 0) score += 20;
  else missingSteps.push('Add your work experience');

  if (educations.length > 0) score += 15;
  else missingSteps.push('Add your education history');

  if (skills.length >= 3) score += 15;
  else missingSteps.push('Add at least 3 skills');

  if (resumes.length > 0) score += 10;
  else missingSteps.push('Upload your resume');

  const displayName =
    profile?.user?.profile?.displayName ||
    viewer?.email?.split('@')[0] ||
    profile?.user?.email?.split('@')[0] ||
    'Candidate';

  return (
    <div className="space-y-8 max-w-6xl pb-16">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200/60 font-mono">
              CANDIDATE PORTAL
            </span>
            <Badge variant="accent" size="sm" className="font-mono text-[10px] flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Evidence Active</span>
            </Badge>
          </div>
          <h1 className="font-display text-3xl font-extrabold text-gray-900 tracking-tight">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            {profile?.headline || 'Setup your profile to start receiving AI job matches.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/candidate/profile">
            <Button variant="secondary" size="md" className="flex items-center gap-1.5 font-semibold">
              <UserCheck className="w-4 h-4 text-gray-600" />
              <span>Edit Profile</span>
            </Button>
          </Link>
          <Link href="/candidate/resume">
            <Button variant="primary" size="md" className="flex items-center gap-1.5 font-bold shadow-sm">
              <Upload className="w-4 h-4" />
              <span>Upload Resume</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 3D Elevated Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card-3d rounded-xl">
          <StatCard
            title="Experience"
            value={
              profile?.yearsOfExperience !== null && profile?.yearsOfExperience !== undefined
                ? `${profile.yearsOfExperience} yrs`
                : `${experiences.length} roles`
            }
            description={`${experiences.length} positions recorded`}
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Skills"
            value={`${skills.length}`}
            description={`${skills.filter((s) => s.isPrimary).length} marked as primary`}
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Resumes"
            value={`${resumes.length}`}
            description={primaryResume ? 'Primary document active' : 'No resume uploaded'}
          />
        </div>
        <div className="card-3d rounded-xl">
          <StatCard
            title="Search Visibility"
            value={profile?.searchVisible ? 'Public' : 'Private'}
            description={profile?.openToRemote ? 'Open to remote roles' : 'Local roles only'}
          />
        </div>
      </div>

      {/* Profile Strength & Primary Resume in 3D Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Strength Gauge */}
        <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md lg:col-span-1 space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                Profile Strength
              </h2>
              <span className="font-mono text-base font-extrabold text-emerald-700">{score}%</span>
            </div>

            <div className="w-full bg-gray-200/70 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-emerald-600 to-teal-500 h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${score}%` }}
              />
            </div>

            {missingSteps.length > 0 ? (
              <div className="space-y-2 pt-4">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  Recommended Next Steps
                </p>
                <ul className="text-xs space-y-2 text-gray-700">
                  {missingSteps.slice(0, 3).map((step) => (
                    <li key={step} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="pt-4 flex items-center gap-2 text-xs text-emerald-800 font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>All core profile sections completed!</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100">
            <Link href="/candidate/profile" className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1">
              <span>Complete profile details</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Primary Resume & Skills */}
        <div className="card-3d rounded-2xl p-6 bg-white border border-gray-200/80 shadow-md lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  Primary Resume & Credentials
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Document referenced by recruiter algorithms and matching engines.
                </p>
              </div>
              <Link href="/candidate/resume">
                <Button variant="ghost" size="sm" className="flex items-center gap-1 text-xs font-semibold text-emerald-800">
                  <span>Manage</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>

            {primaryResume ? (
              <div className="p-4 rounded-xl border border-gray-200/80 bg-gray-50/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100/70 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase shadow-xs">
                    {primaryResume.fileName.endsWith('.pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-gray-900">
                        {primaryResume.fileName}
                      </span>
                      <Badge variant="success" size="sm">Primary</Badge>
                      <Badge variant="outline" size="sm">{primaryResume.parsingStatus}</Badge>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5 font-mono">
                      {(primaryResume.fileSize / 1024).toFixed(1)} KB • Uploaded {new Date(primaryResume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link href="/candidate/resume">
                  <Button variant="secondary" size="sm" className="font-semibold text-xs">
                    View
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-gray-300 text-center space-y-2 bg-gray-50/50">
                <p className="text-xs text-gray-600">
                  You haven&apos;t uploaded any resumes yet.
                </p>
                <Link href="/candidate/resume">
                  <Button variant="primary" size="sm" className="font-bold">
                    Upload Your First Resume
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="pt-4 border-t border-gray-100 mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Featured Verified Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 8).map((skill) => (
                  <Badge key={skill.id} variant={skill.isPrimary ? 'accent' : 'outline'} size="sm">
                    {skill.name}
                  </Badge>
                ))}
                {skills.length > 8 && (
                  <span className="text-xs text-gray-500 self-center font-mono">
                    +{skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3D Quick Links Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <Link href="/candidate/profile" className="block group">
          <div className="card-3d rounded-xl p-5 bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <GraduationCap className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors">
              Work & Academic History
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Maintain your accomplishments, degrees, architecture roles, and competencies.
            </p>
          </div>
        </Link>

        <Link href="/candidate/jobs" className="block group">
          <div className="card-3d rounded-xl p-5 bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Briefcase className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors">
              Discover Matched Roles
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Explore opportunities matched against your verified skills and experience profile.
            </p>
          </div>
        </Link>

        <Link href="/candidate/applications" className="block group">
          <div className="card-3d rounded-xl p-5 bg-white border border-gray-200/80 shadow-xs hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-gray-400 group-hover:text-emerald-700 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
            <h3 className="font-display font-bold text-gray-900 text-sm group-hover:text-emerald-800 transition-colors">
              Application Tracker
            </h3>
            <p className="text-xs text-gray-600 mt-1 leading-relaxed">
              Monitor active interviews, assessment stages, and offers in real time.
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
