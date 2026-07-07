import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const MESSAGES_FILE = path.join(process.cwd(), 'data', 'messages.json');

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

    // Mevcut mesajları oku
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

    const newMessage = {
      id: crypto.randomUUID(),
      name: name.trim(),
      email: email.trim(),
      subject: (subject || '').trim(),
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    messages.push(newMessage);

    // data klasörünün varlığını kontrol et
    const dataDir = path.dirname(MESSAGES_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');

    return NextResponse.json({ success: true, message: 'Mesaj başarıyla kaydedildi.' });
  } catch (error) {
    console.error('Contact API hatası:', error);
    return NextResponse.json(
      { error: 'Sunucu tarafında bir hata oluştu. Lütfen daha sonra tekrar deneyin.' },
      { status: 500 }
    );
  }
}
