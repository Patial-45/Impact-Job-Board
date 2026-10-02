import Link from 'next/link';
import { Card, PageHeader } from '@executive-match/ui';
export function ShellPage({
  eyebrow,
  title,
  description,
  links = [],
}: {
  eyebrow: string;
  title: string;
  description: string;
  links?: { href: string; label: string }[];
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} description={description} />
      <Card className="shell-panel">
        <h2>This space is taking shape.</h2>
        <p>
          The foundation is ready. This module will be built in its roadmap phase, with real data
          and workspace access checks.
        </p>
        {links.length > 0 && (
          <div className="shell-links">
            {links.map((link) => (
              <Link href={link.href} key={link.href}>
                {link.label} ↗
              </Link>
            ))}
          </div>
        )}
      </Card>
    </>
  );
}
