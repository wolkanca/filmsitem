export const dynamic = 'force-static';

export function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://izlediklerim.com';

  const content = `User-agent: *
Allow: /
Disallow: /izle/
Content-Signal: search=yes, ai-train=no

Sitemap: ${baseUrl}/sitemap.xml`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}