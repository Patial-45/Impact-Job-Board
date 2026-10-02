import Link from 'next/link';
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <header className="site-header">
        <div className="container site-header-inner">
          <Link href="/" className="wordmark">
            <span className="brand-mark">
              EM<span>.</span>
            </span>
            <span>Executive Match</span>
          </Link>
          <nav className="site-nav" aria-label="Main navigation">
            <Link href="/jobs">Explore jobs</Link>
            <Link href="/about">About</Link>
            <Link href="/pricing">For teams</Link>
          </nav>
          <div className="site-actions">
            <Link href="/login">Log in</Link>
            <Link className="nav-cta" href="/register">
              Get started <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
      </header>
      {children}
      <footer className="site-footer">
        <div className="container footer-inner">
          <div>
            <span className="footer-logo">
              Executive Match<span>.</span>
            </span>
            <p>Better signals. Better decisions.</p>
          </div>
          <nav aria-label="Footer navigation">
            <Link href="/jobs">Jobs</Link>
            <Link href="/about">About</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/login">Sign in</Link>
          </nav>
          <small>© {new Date().getFullYear()} Executive Match</small>
        </div>
      </footer>
    </>
  );
}
