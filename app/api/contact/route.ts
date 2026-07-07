import { NextResponse } from 'next/server';
import { getStore } from '@netlify/blobs';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !name.trim() || !email || !email.trim() || !message || !message.trim()) {
      return NextResponse.json(
        { error: 'Ad, E-posta ve Mesaj alanları zorunludur.' },
        { status: 400 }
      );
    }

    // E-posta format kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Geçersiz e-posta adresi.' },
        { status: 400 }
      );
    }

    const store = getStore('contact-messages');

    // Mevcut mesajlar listesini oku
    let messages: Array<Record<string, string>> = [];
    try {
      const existing = await store.get('messages', { type: 'json' });
      if (Array.isArray(existing)) {
        messages = existing;
      }
    } catch {
      // İlk mesajsa liste boş olabilir
      messages = [];
    }

    const newMessage = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      subject: (subject || '').trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    messages.push(newMessage);

    await store.setJSON('messages', messages);

    return NextResponse.json({ success: true, message: 'Mesaj başarıyla kaydedildi.' });
  } catch (error) {
    console.error('Contact API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
