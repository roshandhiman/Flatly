'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ChatMessage } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, MessageSquare, Send, Sparkles, RefreshCw } from 'lucide-react';

export default function FlatChatPage() {
  const { flat, profile, isHydrated } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all chat messages for this flat
  const fetchMessages = async () => {
    if (!flat?.id) return;

    try {
      // 1. Try 'messages' table first
      const { data: msgData, error: msgError } = await supabase
        .from('messages')
        .select('*')
        .eq('flat_id', flat.id)
        .order('created_at', { ascending: true });

      if (!msgError && msgData) {
        const list: ChatMessage[] = msgData.map((m: any) => ({
          id: m.id,
          flatId: m.flat_id,
          senderName: m.sender_name,
          text: m.text,
          createdAt: m.created_at,
        }));
        setMessages(list);
        localStorage.setItem(`flatly_chat_${flat.id}`, JSON.stringify(list));
        setLastRefreshed(new Date());
        return;
      }

      // 2. Seamless fallback: use rules table with chat prefix so both devices sync instantly
      const { data: ruleData, error: ruleError } = await supabase
        .from('rules')
        .select('*')
        .eq('flat_id', flat.id)
        .like('text', 'CHAT_MSG::%')
        .order('created_at', { ascending: true });

      if (!ruleError && ruleData) {
        const list: ChatMessage[] = ruleData.map((r: any) => {
          // Format: CHAT_MSG::<senderName>::<text>
          const parts = r.text.split('::');
          const sender = parts[1] || 'Roommate';
          const body = parts.slice(2).join('::');
          return {
            id: r.id,
            flatId: r.flat_id,
            senderName: sender,
            text: body,
            createdAt: r.created_at,
          };
        });
        setMessages(list);
        localStorage.setItem(`flatly_chat_${flat.id}`, JSON.stringify(list));
        setLastRefreshed(new Date());
      }
    } catch (e) {
      // Offline fallback
      const saved = localStorage.getItem(`flatly_chat_${flat.id}`);
      if (saved) {
        try { setMessages(JSON.parse(saved)); } catch (err) {}
      }
    }
  };

  // Initial load + Realtime polling every 2.5 seconds
  useEffect(() => {
    if (!flat?.id) return;

    // Load local cache immediately
    const saved = localStorage.getItem(`flatly_chat_${flat.id}`);
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (err) {}
    }

    // Fetch live from Supabase
    fetchMessages();

    // Fast polling interval (2.5 seconds) so you and your friend see messages immediately
    const interval = setInterval(fetchMessages, 2500);

    // Supabase Realtime Channel
    const channel = supabase
      .channel(`chat-flat-${flat.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', filter: `flat_id=eq.${flat.id}` },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [flat?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !flat?.id) return;

    const senderName = profile?.name || 'Roommate';
    const textToSend = inputText.trim();
    setInputText('');

    const optimisticMsg: ChatMessage = {
      id: generateId(),
      flatId: flat.id,
      senderName,
      text: textToSend,
      createdAt: new Date().toISOString(),
    };

    // Immediate UI update
    setMessages((prev) => [...prev, optimisticMsg]);
    setSending(true);

    try {
      // 1. Try sending to messages table
      const { error: msgErr } = await supabase.from('messages').insert([{
        flat_id: flat.id,
        sender_name: senderName,
        text: textToSend,
      }]);

      if (msgErr) {
        // 2. Seamless sync fallback: send via rules table so it syncs to friend's phone immediately
        await supabase.from('rules').insert([{
          flat_id: flat.id,
          text: `CHAT_MSG::${senderName}::${textToSend}`,
          agreed_by: [],
        }]);
      }
    } catch (err) {
      console.warn('Network send failed, kept in local state');
    } finally {
      setSending(false);
      fetchMessages();
    }
  };

  if (!isHydrated) {
    return <div className="p-8 text-center font-bold text-gray-500">Loading flat chat...</div>;
  }

  if (!flat) {
    return (
      <div className="p-6 md:p-8">
        <EmptyState
          emoji="💬"
          title="No Flat Connected"
          description="Create or join a flat first to chat with your flatmates."
          actionLabel="Go to Flat Setup"
          onAction={() => (window.location.href = '/live')}
        />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto space-y-4 flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b-[2.5px] border-[#111]">
        <div className="flex items-center gap-3">
          <Link
            href="/live"
            className="w-9 h-9 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-heading text-xl md:text-2xl font-black text-[#111] flex items-center gap-2">
              {flat.name} Chat 💬
            </h1>
            <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#3DDC97] animate-pulse" />
              <span>Live Cloud Sync active</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            className="w-8 h-8 rounded-[8px] bg-white border-[1.5px] border-[#111] shadow-[1.5px_1.5px_0_#111] flex items-center justify-center text-gray-600 hover:text-black cursor-pointer"
            title="Refresh messages"
          >
            <RefreshCw size={14} />
          </button>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black">
            <Sparkles size={13} />
            <span>Code: {flat.code}</span>
          </div>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[4px_4px_0_#111]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare size={36} className="mb-2 text-[#FFD23F]" />
            <p className="font-heading font-black text-sm text-[#111]">Pehla message bhejo!</p>
            <p className="text-xs text-gray-500 mt-1">Aap aur aapke dost ke messages yahan live sync honge.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe =
              m.senderName.toLowerCase() === (profile?.name || '').toLowerCase() ||
              m.senderName.toLowerCase().includes('you') ||
              m.senderName.toLowerCase().includes('me');

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[10px] font-bold text-gray-500 mb-1 px-1">
                  {m.senderName} • {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <div
                  className={`max-w-[80%] px-4 py-2.5 rounded-[14px] border-[2px] border-[#111] text-xs font-bold shadow-[2px_2px_0_#111] ${
                    isMe
                      ? 'bg-[#FFD23F] text-[#111]'
                      : 'bg-[#FFF8EC] text-[#111]'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          placeholder="Type message for flatmates..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 px-4 py-3 text-xs font-bold bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] focus:outline-none placeholder:text-gray-400"
        />
        <Button type="submit" variant="primary" size="md" disabled={sending || !inputText.trim()}>
          <span>Send</span>
          <Send size={15} />
        </Button>
      </form>
    </div>
  );
}
