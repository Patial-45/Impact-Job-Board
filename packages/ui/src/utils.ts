export function classes(...values: unknown[]): string {
  return values.filter(Boolean).map(String).join(' ');
}
