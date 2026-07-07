'use client';

import { useState } from 'react';
import { Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setStatus('error');
      setErrorMessage('Lütfen zorunlu alanları (Ad, E-posta, Mesaj) doldurun.');
      return;
    }

    setStatus('loading');
    setErrorMessage('');

    try {
      // 1. Yerel veritabanına kaydet (Admin Inbox'ı için)
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Mesaj gönderilirken bir hata oluştu.');
      }

      // 2. Netlify Forms entegrasyonu (E-posta bildirimi tetiklemek için)
      const encode = (data: Record<string, string>) => {
        return Object.keys(data)
          .map(key => encodeURIComponent(key) + "=" + encodeURIComponent(data[key]))
          .join("&");
      };

      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: encode({
          'form-name': 'contact',
          name,
          email,
          subject,
          message
        })
      }).catch(err => {
        console.error('Netlify Form gönderme hatası:', err);
      });

      setStatus('success');
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
    } catch (err: unknown) {
      setStatus('error');
      setErrorMessage(err instanceof Error ? err.message : 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-zinc-900/60 p-6 md:p-8 shadow-xl backdrop-blur-sm">
      {status === 'success' ? (
        <div className="flex flex-col items-center justify-center text-center py-8 animate-fade-in">
          <div className="mb-4 p-3 bg-emerald-500/10 rounded-full text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h4 className="text-xl font-bold text-white mb-2">Mesajınız İletildi!</h4>
          <p className="text-sm text-zinc-400 max-w-sm">
            Geri bildiriminiz için teşekkürler. Mesajınızı aldım, en kısa sürede inceleyeceğim.
          </p>
          <button
            onClick={() => setStatus('idle')}
            className="mt-6 px-5 py-2.5 rounded-xl border border-zinc-800 bg-zinc-950/60 hover:bg-zinc-900 text-zinc-300 text-xs font-semibold transition-all duration-300 cursor-pointer"
          >
            Yeni Mesaj Gönder
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <h4 className="text-lg font-bold text-white mb-2">İletişim Formu</h4>
          
          {status === 'error' && (
            <div className="p-3.5 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold flex items-start gap-2.5 animate-pulse-subtle">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Ad Soyad */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Adınız *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Adınızı girin..."
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-brand-primary/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all duration-300 placeholder-zinc-600"
                disabled={status === 'loading'}
              />
            </div>

            {/* E-posta */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">E-posta Adresiniz *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresinizi girin..."
                className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-brand-primary/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all duration-300 placeholder-zinc-600"
                disabled={status === 'loading'}
              />
            </div>
          </div>

          {/* Konu */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Konu</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Mesajınızın konusu..."
              className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-brand-primary/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all duration-300 placeholder-zinc-600"
              disabled={status === 'loading'}
            />
          </div>

          {/* Mesaj */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Mesajınız *</label>
            <textarea
              required
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mesajınızı buraya yazın..."
              className="w-full bg-zinc-950/50 border border-zinc-800 focus:border-brand-primary/50 rounded-xl py-3 px-4 text-sm text-white focus:outline-none transition-all duration-300 placeholder-zinc-600 resize-none"
              disabled={status === 'loading'}
            />
          </div>

          {/* Gönder butonu */}
          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-brand-primary to-brand-secondary hover:opacity-95 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-brand-primary/10 hover:shadow-brand-primary/20 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Mesajı Gönder
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
