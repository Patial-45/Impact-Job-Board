import Link from 'next/link';
export default function NotFound() {
  return (
    <main className="container simple-page">
      <h1>Page not found</h1>
      <p>This page isn’t available.</p>
      <Link className="button button-primary" href="/">
        Back to home
      </Link>
    </main>
  );
}
