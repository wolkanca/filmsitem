import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

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

    let messages = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      try {
        const fileContent = fs.readFileSync(MESSAGES_FILE, 'utf8');
        messages = JSON.parse(fileContent);
        if (!Array.isArray(messages)) {
          messages = [];
        }
      } catch (err) {
        console.error('messages.json okuma hatası:', err);
        messages = [];
      }
    }

    // Sort by date descending
    messages.sort((a: any, b: any) => {
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

    if (!fs.existsSync(MESSAGES_FILE)) {
      return NextResponse.json({ error: 'Mesaj bulunamadı.' }, { status: 404 });
    }

    let messages = [];
    try {
      const fileContent = fs.readFileSync(MESSAGES_FILE, 'utf8');
      messages = JSON.parse(fileContent);
      if (!Array.isArray(messages)) {
        messages = [];
      }
    } catch (err) {
      console.error('messages.json okuma hatası:', err);
      return NextResponse.json({ error: 'Dosya okunurken bir hata oluştu.' }, { status: 500 });
    }

    const initialLength = messages.length;
    messages = messages.filter((msg: any) => msg.id !== id);

    if (messages.length === initialLength) {
      return NextResponse.json({ error: 'Belirtilen ID ile eşleşen mesaj bulunamadı.' }, { status: 404 });
    }

    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Mesaj başarıyla silindi.' });
  } catch (error) {
    console.error('Messages DELETE error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
