'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, Loader2, Trash2 } from 'lucide-react';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [deletingMessageId, setDeletingMessageId] = useState<string | null>(null);
  const [messageError, setMessageError] = useState('');

  // Check admin session
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const isAdmin = cookies.some((c) => c.trim().startsWith('is_admin=true'));
    if (!isAdmin) {
      router.push('/admin');
    } else {
      setAuthorized(true);
    }
  }, [router]);

  // Fetch messages when authorized
  useEffect(() => {
    if (!authorized) return;
    setMessagesLoading(true);
    fetch('/api/admin/messages')
      .then((r) => r.json())
      .then((data: ContactMessage[]) => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(() => { })
      .finally(() => setMessagesLoading(false));
  }, [authorized]);

  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Bu mesajı silmek istediğinize emin misiniz?')) return;
    setDeletingMessageId(id);
    setMessageError('');
    try {
      const res = await fetch(`/api/admin/messages?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Mesaj silinemedi.');
      setMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err: any) {
      setMessageError(err.message || 'Silme işlemi sırasında hata oluştu.');
    } finally {
      setDeletingMessageId(null);
    }
  };

  if (!authorized) return null;

  return (
    <div className="max-w-5xl mx-auto py-12 px-4 sm:px-6">
      <div className="space-y-8 animate-fade-in">
        {/* Header / Back */}
        <div className="flex items-center gap-4">
          <Link
            href="/admin"
            className="flex items-center justify-center p-2.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <Mail className="w-8 h-8 text-rose-500" />
              Gelen Mesajlar (Inbox)
            </h1>
            <p className="text-zinc-500 text-sm mt-1">Ziyaretçiler tarafından gönderilen iletişim formları.</p>
          </div>
        </div>

        {/* Messages Card */}
        <div className="glass-card p-6 md:p-8 rounded-3xl border border-white/5 bg-zinc-950/40">
          {messageError && (
            <div className="mb-5 p-3.5 bg-red-950/30 border border-red-500/20 text-red-200 rounded-xl text-xs font-semibold animate-pulse-subtle">
              ⚠️ {messageError}
            </div>
          )}

          {messagesLoading ? (
            <div className="flex items-center justify-center py-20 gap-3 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
              <span className="text-sm font-medium">Mesajlar yükleniyor...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-16 text-zinc-500 text-sm">
              Gelen kutusu boş. Henüz hiç mesaj gönderilmemiş.
            </div>
          ) : (
            <div className="grid gap-6">
              {messages.map((msg) => (
                <div key={msg.id} className="p-6 rounded-2xl bg-zinc-900/40 border border-zinc-800/80 hover:border-zinc-700/80 transition duration-300">
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className="font-bold text-white text-base">{msg.name}</h4>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-400 mt-1.5">
                        <a href={`mailto:${msg.email}`} className="hover:text-rose-400 underline underline-offset-2 decoration-zinc-700">{msg.email}</a>
                        {msg.subject && <span className="text-zinc-600">•</span>}
                        {msg.subject && <span className="text-zinc-300">Konu: {msg.subject}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-medium text-zinc-500 bg-zinc-950/50 border border-zinc-800 px-2 py-1 rounded-md">
                        {new Date(msg.createdAt).toLocaleString('tr-TR')}
                      </span>
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        disabled={deletingMessageId === msg.id}
                        className="p-2 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-zinc-800 hover:border-rose-500/20 transition-all duration-300 cursor-pointer disabled:opacity-50"
                        title="Mesajı Sil"
                      >
                        {deletingMessageId === msg.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-300 leading-relaxed whitespace-pre-line bg-zinc-950/40 p-4 rounded-xl border border-zinc-800/40">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
