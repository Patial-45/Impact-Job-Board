import Link from 'next/link';
import { Badge } from '@executive-match/ui';
export default function HomePage() {
  return (
    <main>
      <section className="hero container">
        <div className="hero-copy">
          <div className="hero-kicker">
            <span className="live-dot" /> A more considered way to hire
          </div>
          <h1>
            Find the right fit.
            <br />
            <span>See why it fits.</span>
          </h1>
          <p>
            Executive Match brings candidates and hiring teams into a clearer, more thoughtful
            process—from discovery to decision.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/register">
              Create your profile <span aria-hidden="true">↗</span>
            </Link>
            <Link className="button button-outline" href="/pricing">
              Explore for teams
            </Link>
          </div>
          <div className="hero-footnote">
            <span className="line" /> Built for people, informed by evidence.
          </div>
        </div>
        <div className="hero-visual" aria-label="Illustration of a candidate and role alignment">
          <div className="visual-top">
            <span>THE MATCH VIEW</span>
            <span>01 / 03</span>
          </div>
          <div className="visual-orbit">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="center-node">
              EM<span>.</span>
            </div>
            <div className="orbit-label orbit-label-a">Experience</div>
            <div className="orbit-label orbit-label-b">Skills</div>
            <div className="orbit-label orbit-label-c">Goals</div>
          </div>
          <div className="visual-bottom">
            <div>
              <small>ALIGNED SIGNALS</small>
              <strong>
                More context.
                <br />
                Less guesswork.
              </strong>
            </div>
            <div className="visual-arrow">↗</div>
          </div>
        </div>
      </section>
      <section className="statement">
        <div className="container statement-grid">
          <span className="section-index">01 / A BETTER SIGNAL</span>
          <div>
            <h2>Hiring works better when everyone sees the whole picture.</h2>
            <p>
              Profiles, roles, and decisions should carry useful context. We’re building the
              foundation for a process that makes strengths visible and keeps teams aligned.
            </p>
          </div>
        </div>
      </section>
      <section className="platform-section container">
        <div className="section-heading">
          <span className="section-index">02 / ONE CONNECTED WORKFLOW</span>
          <h2>
            One place for the work
            <br />
            that leads to a great hire.
          </h2>
        </div>
        <div className="feature-grid">
          <article className="feature-large">
            <div className="feature-number">01</div>
            <div className="feature-preview">
              <div className="preview-header">
                <span>ROLE SIGNALS</span>
                <span>● ● ●</span>
              </div>
              <div className="signal-row">
                <span>Relevant experience</span>
                <div className="signal-bar">
                  <i style={{ width: '78%' }} />
                </div>
              </div>
              <div className="signal-row">
                <span>Core skills</span>
                <div className="signal-bar">
                  <i style={{ width: '89%' }} />
                </div>
              </div>
              <div className="signal-row">
                <span>Growth direction</span>
                <div className="signal-bar">
                  <i style={{ width: '64%' }} />
                </div>
              </div>
            </div>
            <h3>See beyond keywords.</h3>
            <p>
              A future matching layer will bring requirements, experience, and evidence together in
              one explainable view.
            </p>
          </article>
          <article className="feature-small">
            <div className="feature-number">02</div>
            <div className="mini-steps">
              <span>Discover</span>
              <span>Review</span>
              <span>Connect</span>
            </div>
            <h3>Move with clarity.</h3>
            <p>Keep applications, decisions, and next steps organized without adding more noise.</p>
          </article>
          <article className="feature-small">
            <div className="feature-number">03</div>
            <div className="team-preview">
              <span>HIRING WORKSPACE</span>
              <div className="team-lines">
                <i />
                <i />
                <i />
              </div>
              <Badge>Shared context</Badge>
            </div>
            <h3>Work as one team.</h3>
            <p>Give recruiters and hiring teams a shared place to evaluate and collaborate.</p>
          </article>
        </div>
      </section>
      <section className="audience-section">
        <div className="container audience-grid">
          <div className="audience-intro">
            <span className="section-index">03 / BUILT FOR BOTH SIDES</span>
            <h2>A better experience, whichever side you’re on.</h2>
          </div>
          <article>
            <span className="audience-number">01 / CANDIDATES</span>
            <h3>Let your story come through.</h3>
            <p>
              Build a profile that reflects your experience, find relevant roles, and stay oriented
              as applications move forward.
            </p>
            <Link href="/register">
              Start as a candidate <span aria-hidden="true">↗</span>
            </Link>
          </article>
          <article>
            <span className="audience-number">02 / HIRING TEAMS</span>
            <h3>Make every decision more informed.</h3>
            <p>
              Bring jobs, applicants, and team context together in a workspace designed for careful
              hiring.
            </p>
            <Link href="/pricing">
              Explore team access <span aria-hidden="true">↗</span>
            </Link>
          </article>
        </div>
      </section>
      <section className="cta-section container">
        <div>
          <span className="section-index">THE NEXT MOVE</span>
          <h2>
            Make room for
            <br />a better match.
          </h2>
          <p>Join at the beginning and help shape a more useful hiring experience.</p>
          <Link className="button button-light" href="/register">
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <span className="cta-monogram" aria-hidden="true">
          EM.
        </span>
      </section>
    </main>
  );
}
