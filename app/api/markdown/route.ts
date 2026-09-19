import { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const originalPath = searchParams.get('path') || '';

    const markdownText = `# izlediklerim.com

Welcome to izlediklerim.com AI Agent Interface.

Path: /${originalPath}
Description: Film ve dizi takip platformu.
`;

    return new Response(markdownText, {
        status: 200,
        headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Vary': 'Accept',
        },
    });
}