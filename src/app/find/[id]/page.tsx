'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import {
  ArrowLeft,
  Bed,
  CheckCircle2,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  Share2,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';

function ListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { listings, deleteListing } = useStore();
  const listing = listings.find((l) => l.id === id);

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!listing) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-5xl">🔍</div>
        <h2 className="font-heading font-black text-xl text-[#111]">
          Listing Not Found
        </h2>
        <p className="text-xs font-semibold text-gray-500">
          This room listing may have been removed or deleted.
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#FFD23F] border-[2px] border-[#111] rounded-[12px] shadow-[3px_3px_0_#111] text-xs font-black"
        >
          <ArrowLeft size={16} />
          <span>Back to Feed</span>
        </Link>
      </div>
    );
  }

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this listing?')) {
      deleteListing(listing.id);
      router.push('/find');
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] flex items-center justify-center hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="px-3 py-1.5 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] text-xs font-bold flex items-center gap-1 cursor-pointer"
          >
            <Share2 size={14} />
            <span>{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-1.5 rounded-[10px] bg-white border-[2px] border-[#111] shadow-[2px_2px_0_#111] text-red-600 hover:bg-red-50 cursor-pointer"
            title="Delete this listing"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Listing Card */}
      <div className="bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[6px_6px_0_#111] overflow-hidden">
        {/* Banner with Neo-Brutalist artwork */}
        <div className="h-44 bg-[#FFD23F] border-b-[2.5px] border-[#111] flex flex-col items-center justify-center relative p-4 text-center">
          <span className="text-5xl mb-1">🏡</span>
          <span className="px-3 py-1 bg-white border-[1.5px] border-[#111] rounded-full text-xs font-black shadow-[2px_2px_0_#111]">
            Verified Room Post
          </span>

          <span className="absolute bottom-3 right-3 text-[10px] font-bold text-gray-700 bg-white/90 px-2 py-0.5 rounded border border-[#111]">
            Posted {formatDate(listing.createdAt)}
          </span>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <h1 className="font-heading font-black text-2xl text-[#111] leading-tight">
              {listing.title}
            </h1>
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 mt-1.5">
              <MapPin size={15} className="text-[#FF6B57]" />
              <span>{listing.location}</span>
            </div>
          </div>

          {/* Pricing & Capacity highlight block */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[14px]">
            <div>
              <span className="text-[10px] font-black uppercase text-gray-500 block">
                MONTHLY RENT
              </span>
              <div className="font-heading font-black text-2xl text-[#111]">
                {formatINR(listing.rent)}
              </div>
              <span className="text-[10px] text-gray-500 font-bold">per roommate</span>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase text-gray-500 block">
                CAPACITY / SPOT
              </span>
              <div className="font-heading font-black text-2xl text-[#111]">
                {listing.seats} Room
              </div>
              <span className="text-[10px] text-gray-500 font-bold">available now</span>
            </div>
          </div>

          {/* Amenities & Tags */}
          {listing.tags.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-heading font-black text-xs text-[#111] uppercase tracking-wider">
                Features & Amenities
              </h3>
              <div className="flex flex-wrap gap-2">
                {listing.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-[#6EC6FF]/20 border-[1.5px] border-[#111] rounded-[8px] text-xs font-black text-[#111]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <h3 className="font-heading font-black text-xs text-[#111] uppercase tracking-wider">
              About the Place
            </h3>
            <p className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#FFF8EC]/60 p-3 rounded-[12px] border border-gray-200">
              {listing.description}
            </p>
          </div>

          {/* Connect Action Button */}
          <Button
            onClick={() => setIsConnectOpen(true)}
            variant="primary"
            fullWidth
            size="lg"
            className="mt-2"
          >
            <MessageCircle size={18} />
            <span>Connect with Roommate</span>
          </Button>
        </div>
      </div>

      {/* Connect Bottom Sheet (Stage 1 Friendly Modal) */}
      <BottomSheet
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        title="Connect with Flatmate 💬"
      >
        <div className="p-2 space-y-4 text-center">
          <div className="w-14 h-14 bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[3px_3px_0_#111] rounded-[16px] flex items-center justify-center text-3xl mx-auto">
            🤝
          </div>

          <h3 className="font-heading font-black text-lg text-[#111]">
            Stage 1 Preview
          </h3>

          <p className="text-xs font-medium text-gray-600 leading-relaxed max-w-[300px] mx-auto">
            Direct real-time messaging, roommate compatibility AI matching, and background verification are scheduled for <strong>Stage 2</strong>!
          </p>

          <div className="p-3 bg-[#E6F9F0] border-[2px] border-[#111] rounded-[12px] text-xs font-bold text-[#111] text-left space-y-1">
            <div className="flex items-center gap-1.5 text-green-800">
              <CheckCircle2 size={16} />
              <span>Inquiry saved locally!</span>
            </div>
            <p className="text-[11px] text-gray-600">
              You can explore and manage expenses and chores in Live mode in the meantime.
            </p>
          </div>

          <Button
            onClick={() => setIsConnectOpen(false)}
            variant="secondary"
            fullWidth
          >
            Got it, thanks!
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}

export default function ListingDetailPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center font-bold">Loading listing details...</div>}>
      <ListingDetailContent />
    </Suspense>
  );
}
