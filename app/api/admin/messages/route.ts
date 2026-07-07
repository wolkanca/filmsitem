import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';

// Helper to check admin status
function checkIsAdmin(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') || '';
  return cookieHeader.split(';').some((c) => c.trim().startsWith('is_admin=true'));
}

// GET /api/admin/messages - List all messages
export async function GET(req: Request) {
  try {
    if (!checkIsAdmin(req)) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const store = getStore('contact-messages');

    let messages: Array<Record<string, string>> = [];
    try {
      const existing = await store.get('messages', { type: 'json' });
      if (Array.isArray(existing)) {
        messages = existing;
      }
    } catch {
      messages = [];
    }

    // Sort by date descending
    messages.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error('Messages GET error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}

// DELETE /api/admin/messages?id=xxxx - Delete a message
export async function DELETE(req: Request) {
  try {
    if (!checkIsAdmin(req)) {
      return NextResponse.json({ error: 'Yetkisiz erişim.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Mesaj ID (id) parametresi gerekli.' }, { status: 400 });
    }

    const store = getStore('contact-messages');

    let messages: Array<Record<string, string>> = [];
    try {
      const existing = await store.get('messages', { type: 'json' });
      if (Array.isArray(existing)) {
        messages = existing;
      }
    } catch {
      return NextResponse.json({ error: 'Mesaj bulunamadı.' }, { status: 404 });
    }

    const initialLength = messages.length;
    messages = messages.filter((msg) => msg.id !== id);

    if (messages.length === initialLength) {
      return NextResponse.json({ error: 'Belirtilen ID ile eşleşen mesaj bulunamadı.' }, { status: 404 });
    }

    await store.setJSON('messages', messages);

    return NextResponse.json({ success: true, message: 'Mesaj başarıyla silindi.' });
  } catch (error) {
    console.error('Messages DELETE error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
