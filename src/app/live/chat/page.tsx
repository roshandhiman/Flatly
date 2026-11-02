'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store';
import { ChatMessage } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { generateId } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { ArrowLeft, MessageSquare, Send, Sparkles } from 'lucide-react';

export default function FlatChatPage() {
  const { flat, profile, isHydrated } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat messages from localStorage / Supabase
  useEffect(() => {
    if (!flat) return;

    // Load local messages first
    const localKey = `flatly_chat_${flat.id}`;
    const saved = localStorage.getItem(localKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {}
    }

    // Attempt to load from Supabase
    supabase
      .from('messages')
      .select('*')
      .eq('flat_id', flat.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) {
          const remote: ChatMessage[] = data.map((m: any) => ({
            id: m.id,
            flatId: m.flat_id,
            senderName: m.sender_name,
            text: m.text,
            createdAt: m.created_at,
          }));
          setMessages(remote);
          localStorage.setItem(localKey, JSON.stringify(remote));
        }
      });
  }, [flat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !flat) return;

    const senderName = profile?.name || 'Flatmate';
    const newMsg: ChatMessage = {
      id: generateId(),
      flatId: flat.id,
      senderName,
      text: inputText.trim(),
      createdAt: new Date().toISOString(),
    };

    // Update state immediately
    const updated = [...messages, newMsg];
    setMessages(updated);
    localStorage.setItem(`flatly_chat_${flat.id}`, JSON.stringify(updated));
    setInputText('');

    // Try posting to Supabase
    setSending(true);
    try {
      await supabase.from('messages').insert([{
        flat_id: flat.id,
        sender_name: senderName,
        text: newMsg.text,
      }]);
    } catch (err) {
      // Fallback in localStorage
    } finally {
      setSending(false);
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
            <p className="text-xs font-semibold text-gray-500">
              {flat.members.length} roommates in this flat
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full shadow-[2px_2px_0_#111] text-xs font-black">
          <Sparkles size={13} />
          <span>Code: {flat.code}</span>
        </div>
      </div>

      {/* Message Feed */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[4px_4px_0_#111]">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
            <MessageSquare size={36} className="mb-2 text-[#FFD23F]" />
            <p className="font-heading font-black text-sm text-[#111]">Pehla message bhejo!</p>
            <p className="text-xs text-gray-500 mt-1">Discuss groceries, guests, hisab or chores.</p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderName.toLowerCase() === profile?.name?.toLowerCase() || m.senderName.includes('(You)');
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
