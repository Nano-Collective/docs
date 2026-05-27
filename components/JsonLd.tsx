// biome-ignore-all lint/security/noDangerouslySetInnerHtml: Static JSON-LD structured data with no user input
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
