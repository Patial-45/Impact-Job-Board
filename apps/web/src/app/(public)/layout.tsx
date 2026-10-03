import Link from 'next/link';
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="wordmark" aria-label="Executive Match Home">
            <span className="brand-mark" aria-hidden="true">
              EM<span>.</span>
            </span>
            <span>Executive Match</span>
          </Link>

          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/#product">Product</Link>
            <Link href="/#candidates">For Candidates</Link>
            <Link href="/#employers">For Employers</Link>
            <Link href="/jobs">Explore Jobs</Link>
            <Link href="/pricing">Pricing</Link>
          </nav>

          <div className="site-actions">
            <Link href="/login" className="nav-login">
              Sign In
            </Link>
            <Link className="nav-cta" href="/register">
              Get Started <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>

      {children}

      <footer className="site-footer">
        <div className="container footer-grid">
          <div className="footer-brand">
            <Link href="/" className="wordmark">
              <span className="brand-mark">
                EM<span>.</span>
              </span>
              <span>Executive Match</span>
            </Link>
            <p className="footer-tagline">
              Evidence-driven talent matching and structured hiring workflows. Built for clarity, transparency, and human decisions.
            </p>
            <small className="footer-copy">© {new Date().getFullYear()} Executive Match. All rights reserved.</small>
          </div>

          <div className="footer-col">
            <h4>Product</h4>
            <nav aria-label="Product navigation">
              <Link href="/jobs">Discover Roles</Link>
              <Link href="/#candidates">Candidate Profiles</Link>
              <Link href="/#employers">Hiring Workspace</Link>
              <Link href="/pricing">Workspace Pricing</Link>
            </nav>
          </div>

          <div className="footer-col">
            <h4>Workflows</h4>
            <nav aria-label="Workflows navigation">
              <Link href="/#matching">Evidence Matching</Link>
              <Link href="/#features">ATS Pipeline</Link>
              <Link href="/#features">Structured Scoring</Link>
              <Link href="/#features">Collaborative Review</Link>
            </nav>
          </div>

          <div className="footer-col">
            <h4>Company & Trust</h4>
            <nav aria-label="Company navigation">
              <Link href="/about">About Us</Link>
              <Link href="/login">Platform Access</Link>
              <span className="footer-legal-note">Privacy First · Tenant Isolated</span>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
