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
  ShieldCheck,
  Zap,
} from 'lucide-react';

function ListingDetailContent() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { listings, deleteListing, profile } = useStore();
  const listing = listings.find((l) => l.id === id);

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!listing) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto my-12">
        <div className="text-6xl">🔍</div>
        <h2 className="font-heading font-black text-2xl text-[#111]">
          Listing Not Found
        </h2>
        <p className="text-xs md:text-sm font-semibold text-gray-500">
          This room listing may have been filled or removed by the flatmate.
        </p>
        <Link
          href="/find"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFD23F] border-[2px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] text-xs font-black"
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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="px-3.5 py-2 rounded-[12px] bg-white border-[2px] border-[#111] shadow-[2.5px_2.5px_0_#111] flex items-center gap-2 text-xs font-black hover:bg-gray-100 cursor-pointer"
        >
          <ArrowLeft size={16} />
          <span className="hidden sm:inline">Back to Listings</span>
        </button>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleShare}
            className="px-3.5 py-2 rounded-[12px] bg-white border-[2px] border-[#111] shadow-[2.5px_2.5px_0_#111] text-xs font-black flex items-center gap-1.5 cursor-pointer hover:bg-gray-50 transition-all"
          >
            <Share2 size={15} />
            <span>{copiedLink ? 'Link Copied!' : 'Share Room'}</span>
          </button>

          <button
            onClick={handleDelete}
            className="p-2 rounded-[12px] bg-white border-[2px] border-[#111] shadow-[2.5px_2.5px_0_#111] text-red-600 hover:bg-red-50 cursor-pointer transition-all"
            title="Delete this listing"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Room Details & Images & Description (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] overflow-hidden">
            {/* Banner Artwork */}
            <div className="h-52 md:h-64 bg-[#FFD23F] border-b-[2.5px] border-[#111] flex flex-col items-center justify-center relative p-6 text-center">
              <span className="text-6xl md:text-7xl mb-2">🏡</span>
              <span className="px-3.5 py-1 bg-white border-[2px] border-[#111] rounded-full text-xs font-black shadow-[2px_2px_0_#111]">
                Verified Room Vacancy
              </span>

              <span className="absolute bottom-3 right-3 text-xs font-bold text-gray-700 bg-white/90 px-3 py-1 rounded-full border border-[#111]">
                Posted {formatDate(listing.createdAt)}
              </span>
            </div>

            {/* Content Details */}
            <div className="p-6 md:p-8 space-y-6">
              <div>
                <h1 className="font-heading font-black text-2xl md:text-3xl text-[#111] leading-tight">
                  {listing.title}
                </h1>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-600 mt-2">
                  <MapPin size={16} className="text-[#FF6B57]" />
                  <span>{listing.location}</span>
                </div>
              </div>

              {/* Pricing & Capacity highlight block on mobile / tablet */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[16px]">
                <div>
                  <span className="text-[11px] font-black uppercase text-gray-500 block">
                    MONTHLY RENT
                  </span>
                  <div className="font-heading font-black text-2xl md:text-3xl text-[#111]">
                    {formatINR(listing.rent)}
                  </div>
                  <span className="text-xs text-gray-500 font-bold">per roommate</span>
                </div>

                <div>
                  <span className="text-[11px] font-black uppercase text-gray-500 block">
                    AVAILABLE CAPACITY
                  </span>
                  <div className="font-heading font-black text-2xl md:text-3xl text-[#111]">
                    {listing.seats} Spot{listing.seats > 1 ? 's' : ''}
                  </div>
                  <span className="text-xs text-gray-500 font-bold">immediate move-in</span>
                </div>
              </div>

              {/* Amenities & Tags */}
              {listing.tags.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="font-heading font-black text-xs uppercase tracking-wider text-gray-500">
                    Features & Amenities
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {listing.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-[#6EC6FF]/25 border-[1.5px] border-[#111] rounded-[10px] text-xs font-black text-[#111] shadow-[1.5px_1.5px_0_#111]"
                      >
                        ✓ {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Description */}
              <div className="space-y-2.5">
                <h3 className="font-heading font-black text-xs uppercase tracking-wider text-gray-500">
                  About the Place & Roommate Expectations
                </h3>
                <p className="text-xs md:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#FFF8EC]/60 p-4 rounded-[16px] border-[1.5px] border-black/15">
                  {listing.description}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Sticky Booking CTA & Roommate Compatibility Score (Col 5) */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-24">
          {/* Action CTA Card */}
          <div className="p-6 bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b-[2px] border-[#111]">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                  RENT PER MONTH
                </span>
                <div className="font-heading font-black text-3xl text-[#111]">
                  {formatINR(listing.rent)}
                </div>
              </div>
              <span className="px-3 py-1 bg-[#3DDC97] text-[#111] border-[1.5px] border-[#111] rounded-full text-xs font-black shadow-[1.5px_1.5px_0_#111]">
                Available Now
              </span>
            </div>

            <Button
              onClick={() => setIsConnectOpen(true)}
              variant="primary"
              fullWidth
              size="lg"
              className="py-3.5"
            >
              <MessageCircle size={20} />
              <span>Connect with Flatmate</span>
            </Button>

            <p className="text-center text-[11px] font-semibold text-gray-500">
              No brokerage fees • Verified student & young professional listings
            </p>
          </div>

          {/* Roommate Compatibility Preview Card */}
          <div className="p-6 bg-[#FFF8EC] border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-heading font-black text-base text-[#111]">
                  Roommate Compatibility
                </h3>
              </div>
              <span className="px-2.5 py-0.5 bg-[#FFD23F] border-[1.5px] border-[#111] rounded-full text-xs font-black shadow-[1px_1px_0_#111]">
                88% Match
              </span>
            </div>

            <p className="text-xs text-gray-600 font-medium">
              Based on your habits profile ({profile?.habits?.sleepTime ? 'Completed' : 'Set up in Profile'}):
            </p>

            <div className="space-y-2 text-xs font-bold text-[#111]">
              <div className="flex items-center justify-between p-2.5 bg-white border-[1.5px] border-[#111] rounded-[10px]">
                <span>😴 Sleep Hours</span>
                <span className="text-[#00A86B]">Match (Aligned)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border-[1.5px] border-[#111] rounded-[10px]">
                <span>🧼 Cleanliness Standard</span>
                <span className="text-[#00A86B]">Match (Regular Tidy)</span>
              </div>
              <div className="flex items-center justify-between p-2.5 bg-white border-[1.5px] border-[#111] rounded-[10px]">
                <span>🚭 Smoking Policy</span>
                <span className="text-[#00A86B]">No Dealbreaker</span>
              </div>
            </div>

            <Link
              href="/profile"
              className="block text-center text-xs font-black text-gray-700 underline hover:text-black pt-1"
            >
              Update your habits profile &rarr;
            </Link>
          </div>
        </div>
      </div>

      {/* Connect Bottom Sheet (Stage 1 Friendly Modal) */}
      <BottomSheet
        isOpen={isConnectOpen}
        onClose={() => setIsConnectOpen(false)}
        title="Connect with Flatmate 💬"
      >
        <div className="p-2 space-y-4 text-center">
          <div className="w-16 h-16 bg-[#FFD23F] border-[2.5px] border-[#111] shadow-[4px_4px_0_#111] rounded-[20px] flex items-center justify-center text-3xl mx-auto">
            🤝
          </div>

          <h3 className="font-heading font-black text-xl text-[#111]">
            Direct Connection Request
          </h3>

          <p className="text-xs md:text-sm font-semibold text-gray-600 leading-relaxed max-w-sm mx-auto">
            Your inquiry for <strong>{listing.title}</strong> has been recorded! You can coordinate rent splits and chores as soon as you move in.
          </p>

          <div className="p-4 bg-[#E6F9F0] border-[2px] border-[#111] rounded-[14px] text-xs font-bold text-[#111] text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-800 font-black">
              <CheckCircle2 size={16} />
              <span>Contact interest noted!</span>
            </div>
            <p className="text-xs text-gray-600">
              In Stage 2, direct WhatsApp and in-app instant chat will connect you straight to the poster.
            </p>
          </div>

          <Button
            onClick={() => setIsConnectOpen(false)}
            variant="secondary"
            fullWidth
            size="lg"
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
