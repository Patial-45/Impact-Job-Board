import Link from 'next/link';
import { getCandidateProfile, getViewer } from '@/lib/api';
import { StatCard, Card, Badge, Button } from '@executive-match/ui';

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
    <div className="space-y-8 max-w-6xl">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-border">
        <div>
          <p className="text-xs font-semibold tracking-wider uppercase text-primary mb-1">
            CANDIDATE DASHBOARD
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {displayName}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {profile?.headline || 'Setup your profile to start receiving AI job matches.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/candidate/profile">
            <Button variant="secondary" size="md">
              Edit Profile
            </Button>
          </Link>
          <Link href="/candidate/resume">
            <Button variant="primary" size="md">
              Upload Resume
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Experience"
          value={
            profile?.yearsOfExperience !== null && profile?.yearsOfExperience !== undefined
              ? `${profile.yearsOfExperience} yrs`
              : `${experiences.length} roles`
          }
          description={`${experiences.length} positions recorded`}
        />
        <StatCard
          title="Skills"
          value={`${skills.length}`}
          description={`${skills.filter((s) => s.isPrimary).length} marked as primary`}
        />
        <StatCard
          title="Resumes"
          value={`${resumes.length}`}
          description={primaryResume ? 'Primary resume active' : 'No resume uploaded'}
        />
        <StatCard
          title="Search Visibility"
          value={profile?.searchVisible ? 'Public' : 'Private'}
          description={profile?.openToRemote ? 'Open to remote roles' : 'Local roles only'}
        />
      </div>

      {/* Profile Strength & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card variant="outline" className="p-6 lg:col-span-1 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-semibold text-foreground">Profile Strength</h2>
            <span className="text-lg font-bold text-primary">{score}%</span>
          </div>

          <div className="w-full bg-border rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>

          {missingSteps.length > 0 ? (
            <div className="space-y-2 pt-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Recommended Next Steps
              </p>
              <ul className="text-sm space-y-1.5 text-foreground/80">
                {missingSteps.slice(0, 3).map((step) => (
                  <li key={step} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    {step}
                  </li>
                ))}
              </ul>
              <div className="pt-2">
                <Link href="/candidate/profile" className="text-xs font-semibold text-primary hover:underline">
                  Complete profile now →
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-xs text-success font-medium pt-2">
              ✓ All core profile sections completed!
            </p>
          )}
        </Card>

        {/* Primary Resume & Status */}
        <Card variant="outline" className="p-6 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-base font-semibold text-foreground">Primary Resume</h2>
                <p className="text-xs text-muted-foreground">
                  The document recruiters review when evaluating your applications.
                </p>
              </div>
              <Link href="/candidate/resume">
                <Button variant="ghost" size="sm">
                  Manage Resumes →
                </Button>
              </Link>
            </div>

            {primaryResume ? (
              <div className="p-4 rounded-xl border border-border bg-card/40 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs uppercase">
                    {primaryResume.fileName.endsWith('.pdf') ? 'PDF' : 'DOC'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-foreground">
                        {primaryResume.fileName}
                      </span>
                      <Badge variant="success">Primary</Badge>
                      <Badge variant="outline">{primaryResume.parsingStatus}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(primaryResume.fileSize / 1024).toFixed(1)} KB • Uploaded on{' '}
                      {new Date(primaryResume.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Link href="/candidate/resume">
                  <Button variant="secondary" size="sm">
                    View
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="p-6 rounded-xl border border-dashed border-border text-center space-y-3">
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t uploaded any resumes yet.
                </p>
                <Link href="/candidate/resume">
                  <Button variant="primary" size="sm">
                    Upload Your First Resume
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {skills.length > 0 && (
            <div className="pt-4 border-t border-border mt-4">
              <p className="text-xs font-medium text-muted-foreground mb-2">Featured Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {skills.slice(0, 8).map((skill) => (
                  <Badge key={skill.id} variant={skill.isPrimary ? 'accent' : 'outline'} size="sm">
                    {skill.name}
                  </Badge>
                ))}
                {skills.length > 8 && (
                  <span className="text-xs text-muted-foreground self-center">
                    +{skills.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Quick Links Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
        <Link href="/candidate/profile" className="block group">
          <Card variant="outline" className="p-5 hover:border-primary/50 transition-colors">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
              Work & Academic History →
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Add your recent roles, accomplishments, degrees, and primary certifications.
            </p>
          </Card>
        </Link>
        <Link href="/candidate/jobs" className="block group">
          <Card variant="outline" className="p-5 hover:border-primary/50 transition-colors">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
              Discover Jobs →
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Browse openings matched against your verified skills and experience profile.
            </p>
          </Card>
        </Link>
        <Link href="/candidate/applications" className="block group">
          <Card variant="outline" className="p-5 hover:border-primary/50 transition-colors">
            <h3 className="font-semibold text-foreground text-sm group-hover:text-primary transition-colors">
              Application Tracker →
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              Monitor active interviews, assessment stages, and offers in real-time.
            </p>
          </Card>
        </Link>
      </div>
    </div>
  );
}
