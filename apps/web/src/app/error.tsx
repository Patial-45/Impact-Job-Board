'use client';
import { Button } from '@executive-match/ui';
export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container simple-page">
      <h1>Something went wrong.</h1>
      <p>Please try again.</p>
      <Button onClick={reset}>Retry</Button>
    </main>
  );
}
