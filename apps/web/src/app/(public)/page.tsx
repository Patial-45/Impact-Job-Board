import Link from 'next/link';
import {
  Badge,
  Button,
  Card,
  CandidateCard,
  JobCard,
  MatchScore,
  PipelineStage,
  SkillBadge,
  StatCard,
} from '@executive-match/ui';

export default function HomePage() {
  return (
    <main>
      {/* 1. Hero Section */}
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" /> Evidence-Driven Recruitment
          </div>
          <h1>
            Find the right fit.
            <br />
            <span>See why it fits.</span>
          </h1>
          <p>
            Executive Match brings candidates and hiring teams into an editorial, transparent hiring
            workflow. Every match is backed by explainable evidence—never opaque algorithmic scores.
          </p>
          <div className="hero-actions">
            <Link href="/register">
              <Button size="lg">
                Create Candidate Profile <span aria-hidden="true">↗</span>
              </Button>
            </Link>
            <Link href="/pricing">
              <Button variant="outline" size="lg">
                For Hiring Teams
              </Button>
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="line" /> AI advises on requirements · People make hiring decisions.
          </div>
        </div>

        {/* Hero Interactive Visual Demonstration */}
        <div className="hero-visual" aria-label="Interactive preview of candidate and role evidence matching">
          <div className="visual-top">
            <span>EVIDENCE ALIGNMENT</span>
            <span>MATCH SCORE 92%</span>
          </div>

          <div className="visual-orbit">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="center-node">
              EM<span>.</span>
            </div>
            <div className="orbit-label orbit-label-a">Architecture (94%)</div>
            <div className="orbit-label orbit-label-b">TypeScript & React (96%)</div>
            <div className="orbit-label orbit-label-c">Domain Scope (88%)</div>
          </div>

          <div className="visual-bottom">
            <div>
              <small>TRANSPARENT MATCHING</small>
              <strong>
                Relevant context.
                <br />
                Zero guesswork.
              </strong>
            </div>
            <div className="visual-arrow">↗</div>
          </div>
        </div>
      </section>

      {/* 2. Product Narrative & Problem Statement */}
      <section className="statement" id="product">
        <div className="container statement-grid">
          <span className="section-index">01 / THE PROBLEM WITH HIRING</span>
          <div>
            <h2>Resumes are compressed. Job posts are vague. Decisions deserve context.</h2>
            <p>
              Traditional recruiting tools rely on shallow keyword filters that miss exceptional candidates
              or generate unverified AI match scores that hiring managers cannot trust. Executive Match
              structures requirements and candidate experience into verifiable signals, giving both sides
              the evidence they need to move forward with confidence.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Product UI Preview Mockup */}
      <section className="preview-section container">
        <div className="section-heading">
          <div>
            <span className="section-index">02 / INTERFACE PREVIEW</span>
            <h2>Designed for speed, clarity, and deep evaluation.</h2>
          </div>
          <Badge variant="accent">Previewing ATS Pipeline</Badge>
        </div>

        <div className="dashboard-preview-card">
          <div className="preview-topbar">
            <div className="preview-tabs">
              <span className="preview-tab preview-tab--active">Role Overview</span>
              <span className="preview-tab">Shortlisted (8)</span>
              <span className="preview-tab">Interviews (3)</span>
            </div>
            <div className="preview-status">
              <PipelineStage stage="Technical Review" order={3} active />
            </div>
          </div>

          <div className="preview-grid">
            <div className="preview-left">
              <CandidateCard
                name="Elena Vance"
                headline="Staff Systems Architect · Cloud Platform & Distributed Systems"
                location="San Francisco, CA (Remote)"
                matchScore={94}
                yearsExperience={11}
                skills={['TypeScript', 'PostgreSQL', 'NestJS', 'Distributed Systems', 'Kubernetes']}
              />
              <div className="preview-match-detail">
                <span className="preview-subhead">Matching Evidence Breakdown</span>
                <MatchScore
                  score={94}
                  showBreakdown
                  breakdown={{
                    skills: 96,
                    experience: 92,
                    growth: 90,
                  }}
                />
              </div>
            </div>

            <div className="preview-right">
              <JobCard
                title="Lead Platform Engineer"
                companyName="Executive Match Workspace"
                location="Remote · US / EU"
                salary="$175,000 - $215,000"
                type="Remote"
                postedAt="2 days ago"
                matchScore={94}
                skills={['Next.js 16', 'NestJS', 'PostgreSQL', 'Redis']}
              />

              <div className="preview-stats-row">
                <StatCard
                  title="Qualified Inflow"
                  value="42"
                  change={{ value: '+18% vs avg', trend: 'up' }}
                />
                <StatCard
                  title="Time to First Review"
                  value="1.4d"
                  change={{ value: '-35%', trend: 'up' }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Two-Sided Workflows (Candidates & Employers) */}
      <section className="workflow-section" id="candidates">
        <div className="container">
          <div className="section-heading">
            <span className="section-index">03 / HOW IT WORKS</span>
            <h2>Structured workflows for candidates and hiring teams.</h2>
          </div>

          <div className="workflow-split">
            {/* Candidate Workflow */}
            <div className="workflow-col">
              <div className="workflow-header">
                <span className="workflow-badge">FOR CANDIDATES</span>
                <h3>Own your career narrative.</h3>
                <p>Build a profile that captures your real strengths, not just keyword density.</p>
              </div>

              <div className="workflow-steps">
                <div className="workflow-step">
                  <span className="step-num">01</span>
                  <div>
                    <h4>Structured Profile & Resume</h4>
                    <p>Import your resume or create your profile with validated skills, roles, and career goals.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">02</span>
                  <div>
                    <h4>Contextual Job Discovery</h4>
                    <p>Browse verified roles with upfront salary ranges, tech stack details, and team context.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">03</span>
                  <div>
                    <h4>Transparent Match Explanations</h4>
                    <p>Inspect why a role aligns with your background, including skill overlap and domain gaps.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">04</span>
                  <div>
                    <h4>Real-Time Application Tracking</h4>
                    <p>Never wonder where you stand. Track your status as applications progress through hiring stages.</p>
                  </div>
                </div>
              </div>

              <div className="workflow-cta">
                <Link href="/register">
                  <Button variant="primary">Get Started as Candidate ↗</Button>
                </Link>
              </div>
            </div>

            {/* Employer ATS Workflow */}
            <div className="workflow-col" id="employers">
              <div className="workflow-header">
                <span className="workflow-badge">FOR HIRING TEAMS</span>
                <h3>Make defensible hiring decisions.</h3>
                <p>A unified workspace where recruiters and engineering leads evaluate talent together.</p>
              </div>

              <div className="workflow-steps">
                <div className="workflow-step">
                  <span className="step-num">01</span>
                  <div>
                    <h4>Define Objective Role Signals</h4>
                    <p>Draft job requisitions with required competencies, deal-breakers, and growth trajectories.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">02</span>
                  <div>
                    <h4>Evidence-Driven Shortlisting</h4>
                    <p>Review incoming applicants with structured evidence cards highlighting proven qualifications.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">03</span>
                  <div>
                    <h4>Collaborative ATS Pipeline</h4>
                    <p>Move candidates seamlessly through customizable stages with internal notes and team ratings.</p>
                  </div>
                </div>

                <div className="workflow-step">
                  <span className="step-num">04</span>
                  <div>
                    <h4>Secure Tenant Isolation</h4>
                    <p>Every workspace is strictly isolated at the database layer with granular team permissions.</p>
                  </div>
                </div>
              </div>

              <div className="workflow-cta">
                <Link href="/pricing">
                  <Button variant="secondary">Explore Team Workspace ↗</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Feature Grid */}
      <section className="platform-section container" id="features">
        <div className="section-heading">
          <span className="section-index">04 / PLATFORM CAPABILITIES</span>
          <h2>
            Engineered for precision.
            <br />
            Built for modern hiring teams.
          </h2>
        </div>

        <div className="feature-grid-six">
          <Card className="feature-box">
            <span className="feature-num">01</span>
            <h3>Explainable AI Matching</h3>
            <p>
              Advisory matching that highlights specific alignment evidence across skills, experience,
              and project scale.
            </p>
            <div className="feature-pills">
              <SkillBadge skill="Evidence Score" verified />
              <SkillBadge skill="Gap Analysis" />
            </div>
          </Card>

          <Card className="feature-box">
            <span className="feature-num">02</span>
            <h3>Modern ATS Pipeline</h3>
            <p>
              Drag-and-drop workflow stages from application to final offer with immutable audit trails.
            </p>
            <div className="feature-pills">
              <PipelineStage stage="Review" order={1} />
              <PipelineStage stage="Interview" order={2} active />
            </div>
          </Card>

          <Card className="feature-box">
            <span className="feature-num">03</span>
            <h3>Tenant-Isolated Workspaces</h3>
            <p>
              Strict server-enforced workspace boundaries ensure company data is never intermingled.
            </p>
            <div className="feature-pills">
              <Badge variant="neutral">Owner</Badge>
              <Badge variant="neutral">Admin</Badge>
              <Badge variant="neutral">Recruiter</Badge>
            </div>
          </Card>

          <Card className="feature-box">
            <span className="feature-num">04</span>
            <h3>Resume Intelligence</h3>
            <p>
              Standardized extraction of experience, certifications, and technical proficiencies with privacy safeguards.
            </p>
            <div className="feature-pills">
              <Badge variant="accent">Private By Default</Badge>
            </div>
          </Card>

          <Card className="feature-box">
            <span className="feature-num">05</span>
            <h3>Structured Candidate Search</h3>
            <p>
              Filter talent pools by validated capabilities, location preference, and availability without keyword pollution.
            </p>
            <div className="feature-pills">
              <Badge variant="success">Zero Noise</Badge>
            </div>
          </Card>

          <Card className="feature-box">
            <span className="feature-num">06</span>
            <h3>Collaborative Notes & Review</h3>
            <p>
              Collect hiring team feedback and evaluation rubrics in one consolidated candidate dossier.
            </p>
            <div className="feature-pills">
              <Badge variant="outline">Unified Dossier</Badge>
            </div>
          </Card>
        </div>
      </section>

      {/* 6. Dual Conversion CTA Section */}
      <section className="cta-dual-section container">
        <div className="cta-card cta-card--primary">
          <span className="section-index">FOR CANDIDATES</span>
          <h2>Make room for a better match.</h2>
          <p>Create your profile in minutes and discover opportunities where your strengths are recognized.</p>
          <Link href="/register">
            <Button size="lg" className="button-light">
              Get Started Free <span aria-hidden="true">↗</span>
            </Button>
          </Link>
        </div>

        <div className="cta-card cta-card--secondary">
          <span className="section-index">FOR HIRING TEAMS</span>
          <h2>Hire with evidence, not guesswork.</h2>
          <p>Empower your recruiting team with structured applicant tracking and transparent matching context.</p>
          <Link href="/pricing">
            <Button size="lg" variant="outline">
              Request Workspace Access <span aria-hidden="true">↗</span>
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}
