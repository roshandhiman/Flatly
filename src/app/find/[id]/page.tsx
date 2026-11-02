'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatINR, formatDate } from '@/lib/utils';
import { computeCompatibility, compatStatusMeta, CompatStatus } from '@/lib/compatibility';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Avatar } from '@/components/ui/Avatar';
import {
  ArrowLeft,
  Bed,
  Check,
  CheckCircle2,
  Heart,
  Info,
  MapPin,
  MessageCircle,
  MessageSquare,
  Phone,
  Share2,
  Sparkles,
  Star,
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

  const { listings, addReviewToListing, profile } = useStore();
  const listing = listings.find((l) => l.id === id);

  // Real profile-vs-listing compatibility (computed, not hardcoded)
  const compat = useMemo(
    () => (listing ? computeCompatibility(profile, listing) : null),
    [profile, listing]
  );

  const [isConnectOpen, setIsConnectOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [selectedPhotoIdx, setSelectedPhotoIdx] = useState(0);

  // AI Analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ analysis: string; provider: string } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // New review state
  const [reviewerName, setReviewerName] = useState(profile?.name || '');
  const [newRating, setNewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const handleRunAiAnalysis = async () => {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'analyze-room',
          payload: { listing, profile },
        }),
      });
      const data = await res.json();
      if (res.ok && data.analysis) {
        setAiResult({ analysis: data.analysis, provider: data.provider });
      } else {
        setAiError(data.error || 'AI service unreachable. Thodi der baad try karo.');
      }
    } catch (err) {
      console.error('AI analysis error:', err);
      setAiError('AI service unreachable. Thodi der baad try karo.');
    } finally {
      setAiLoading(false);
    }
  };

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

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) return;

    addReviewToListing(listing.id, {
      author: reviewerName.trim() || 'Anonymous Roommate',
      rating: newRating,
      comment: reviewComment.trim(),
    });

    setReviewComment('');
    setReviewSuccess(true);
    setTimeout(() => setReviewSuccess(false), 3000);
  };

  const photos = listing.gallery && listing.gallery.length > 0
    ? listing.gallery
    : listing.imageUrl
    ? [listing.imageUrl]
    : [
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      ];

  const reviews = listing.reviews || [];
  const averageRating = listing.rating || 4.8;
  const reviewCount = listing.reviewCount || reviews.length;

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
        </div>
      </div>

      {/* Main Responsive Grid Layout (Desktop 2-Col, Mobile 1-Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Room Details & Images & Description & Reviews (Col 7) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] overflow-hidden">
            {/* Main Photo Display */}
            <div className="relative h-64 sm:h-80 md:h-96 bg-gray-100 border-b-[2.5px] border-[#111] overflow-hidden">
              <img
                src={photos[selectedPhotoIdx] || photos[0]}
                alt={listing.title}
                className="w-full h-full object-cover"
              />

              <div className="absolute top-4 left-4 flex gap-2">
                <span className="px-3.5 py-1 bg-white border-[2px] border-[#111] rounded-full text-xs font-black shadow-[2px_2px_0_#111]">
                  Verified Room Vacancy
                </span>
                {listing.city && (
                  <span className="px-3 py-1 bg-[#FFD23F] border-[2px] border-[#111] rounded-full text-xs font-black shadow-[2px_2px_0_#111]">
                    📍 {listing.city}
                  </span>
                )}
              </div>

              <div className="absolute bottom-4 right-4 flex items-center gap-1.5 px-3 py-1 bg-black/80 backdrop-blur-xs text-white rounded-full text-xs font-bold border border-white/20">
                <Star size={13} className="text-[#FFD23F] fill-[#FFD23F]" />
                <span className="font-black">{averageRating}</span>
                <span>({reviewCount} reviews)</span>
              </div>
            </div>

            {/* Photo Gallery Thumbnails */}
            {photos.length > 1 && (
              <div className="flex gap-2 p-3 bg-[#FFF8EC] border-b-[2px] border-[#111] overflow-x-auto">
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedPhotoIdx(idx)}
                    className={`relative w-20 h-14 rounded-[10px] border-[2px] border-[#111] overflow-hidden flex-shrink-0 cursor-pointer transition-all ${
                      selectedPhotoIdx === idx
                        ? 'ring-2 ring-black scale-105 shadow-[2px_2px_0_#111]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

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

              {/* Pricing & Capacity highlight block */}
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
                    Features &amp; Amenities
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
                  About the Place &amp; Roommate Expectations
                </h3>
                <p className="text-xs md:text-sm font-medium text-gray-800 leading-relaxed whitespace-pre-wrap bg-[#FFF8EC]/60 p-4 rounded-[16px] border-[1.5px] border-black/15">
                  {listing.description}
                </p>
              </div>

              {/* Poster Contact Info */}
              {listing.contactName && (
                <div className="p-4 bg-white border-[2px] border-[#111] rounded-[16px] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={listing.contactName} color="#FFD23F" size="md" />
                    <div>
                      <div className="font-heading font-black text-sm text-[#111]">
                        {listing.contactName}
                      </div>
                      <div className="text-xs text-gray-500 font-bold">Current Flatmate / Poster</div>
                    </div>
                  </div>
                  {listing.contactPhone && (
                    <span className="text-xs font-mono font-bold bg-[#3DDC97] px-3 py-1.5 rounded-[10px] border border-[#111] shadow-[1px_1px_0_#111]">
                      {listing.contactPhone}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* REVIEWS & COMMENTS SECTION */}
          <div className="bg-white border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] p-6 md:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b-[2px] border-[#111]">
              <div className="flex items-center gap-2">
                <MessageSquare size={20} />
                <h3 className="font-heading font-black text-lg md:text-xl text-[#111]">
                  Roommate Ratings &amp; Comments ({reviews.length})
                </h3>
              </div>
              <div className="flex items-center gap-1.5 bg-[#FFD23F] px-3 py-1 rounded-full border border-[#111] shadow-[1.5px_1.5px_0_#111]">
                <Star size={14} className="fill-[#111] text-[#111]" />
                <span className="font-heading font-black text-sm text-[#111]">{averageRating} / 5.0</span>
              </div>
            </div>

            {/* List Existing Reviews */}
            {reviews.length === 0 ? (
              <div className="p-6 bg-[#FFF8EC] border-[2px] border-dashed border-[#111] rounded-[16px] text-center">
                <p className="text-xs font-bold text-gray-600">
                  No reviews yet. Be the first roommate or visitor to leave a review!
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-4 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[16px] shadow-[2.5px_2.5px_0_#111] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={rev.author} color={rev.avatarColor || '#FFD23F'} size="sm" />
                        <div>
                          <span className="font-heading font-black text-xs text-[#111]">
                            {rev.author}
                          </span>
                          <span className="text-[10px] text-gray-400 block font-semibold">
                            {formatDate(rev.date)}
                          </span>
                        </div>
                      </div>

                      {/* Stars */}
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            className={
                              i < rev.rating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-xs font-medium text-gray-800 leading-relaxed pl-9">
                      {rev.comment}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Review Form */}
            <div className="pt-4 border-t-[2px] border-[#111] space-y-3">
              <h4 className="font-heading font-black text-sm text-[#111]">
                Leave a Comment &amp; Rating ✍️
              </h4>

              {reviewSuccess && (
                <div className="p-3 bg-[#3DDC97] border-[1.5px] border-[#111] rounded-[12px] text-xs font-black text-[#111] flex items-center gap-2 shadow-[2px_2px_0_#111]">
                  <Check size={16} strokeWidth={3} />
                  <span>Review and rating added successfully!</span>
                </div>
              )}

              <form onSubmit={handleAddReview} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-600 block mb-1">
                      Your Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aman, Priya"
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold bg-[#FFF8EC] border-[2px] border-[#111] rounded-[10px] shadow-[1.5px_1.5px_0_#111] focus:outline-none focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-gray-600 block mb-1">
                      Rating (1 to 5 Stars)
                    </label>
                    <div className="flex items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setNewRating(star)}
                          className="cursor-pointer transition-transform hover:scale-110"
                        >
                          <Star
                            size={20}
                            className={
                              star <= newRating
                                ? 'text-amber-500 fill-amber-500'
                                : 'text-gray-300'
                            }
                          />
                        </button>
                      ))}
                      <span className="text-xs font-black text-[#111] ml-2">
                        {newRating} / 5
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-600 block mb-1">
                    Your Review / Feedback
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe the atmosphere, flatmates, amenities, noise levels, or neighborhood..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-[#FFF8EC] border-[2px] border-[#111] rounded-[10px] shadow-[1.5px_1.5px_0_#111] focus:outline-none focus:bg-white"
                  />
                </div>

                <Button type="submit" variant="secondary" size="md">
                  <Star size={15} />
                  <span>Submit Review</span>
                </Button>
              </form>
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
              No brokerage fees • Verified student &amp; young professional listings
            </p>
          </div>

          {/* Roommate Compatibility Card (real profile-based calculation) */}
          <div className="p-6 bg-[#FFF8EC] border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">⚡</span>
                <h3 className="font-heading font-black text-base text-[#111]">
                  Roommate Compatibility
                </h3>
              </div>
              {compat && (
                <span className={`px-2.5 py-0.5 border-[1.5px] border-[#111] rounded-full text-xs font-black shadow-[1px_1px_0_#111] ${
                  compat.score >= 75 ? 'bg-[#3DDC97]' : compat.score >= 55 ? 'bg-[#FFD23F]' : 'bg-[#FF6B57]'
                }`}>
                  {compat.score}% Match
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 font-medium">
              {compat
                ? 'Aapke profile habits vs is listing ki real information se calculated:'
                : 'Compatibility score calculate karne ke liye apna habits profile set up karo:'}
            </p>

            {compat && (
              <div className="space-y-2 text-xs font-bold text-[#111]">
                {compat.factors.map((factor) => {
                  const meta = compatStatusMeta(factor.status as CompatStatus);
                  return (
                    <div key={factor.label} className="p-2.5 bg-white border-[1.5px] border-[#111] rounded-[10px]">
                      <div className="flex items-center justify-between">
                        <span>{factor.label}</span>
                        <span className={meta.color}>{meta.text}</span>
                      </div>
                      <p className="text-[10px] font-semibold text-gray-500 mt-1 leading-relaxed">
                        {factor.detail}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            <Link
              href="/profile"
              className="block text-center text-xs font-black text-gray-700 underline hover:text-black pt-1"
            >
              Update your habits profile &rarr;
            </Link>
          </div>

          {/* AI Room Analyzer Card (cloud LLM: Groq / Gemini) */}
          <div className="p-6 bg-[#6EC6FF]/20 border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-4">
            <div className="flex items-center justify-between pb-2 border-b-[2px] border-[#111]">
              <div className="flex items-center gap-2">
                <span className="text-xl">🤖</span>
                <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                  AI Room Advisor
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-[#3DDC97] border border-[#111] rounded-full text-[10px] font-black shadow-[1px_1px_0_#111]">
                {aiResult ? aiResult.provider.split('(')[1]?.replace(')', '') || 'Cloud AI' : 'Live AI'}
              </span>
            </div>

            <p className="text-xs font-semibold text-gray-700 leading-relaxed">
              Ye room ka real-time honest analysis {profile?.habits?.sleepTime ? 'aapke profile habits ko consider karke' : ''} cloud AI model se — no canned text, only live output from the actual provider shown above.
            </p>

            {aiError && (
              <div className="p-4 bg-[#FF6B57]/15 border-[2px] border-[#FF6B57] rounded-[16px] space-y-1.5 shadow-[2px_2px_0_#111]">
                <div className="text-[10px] font-black text-[#FF3B30] uppercase">AI UNAVAILABLE</div>
                <div className="text-xs font-medium text-gray-800">{aiError}</div>
              </div>
            )}

            {aiResult && (
              <div className="p-4 bg-white border-[2px] border-[#111] rounded-[16px] space-y-2.5 shadow-[2px_2px_0_#111] animate-in fade-in">
                <div className="flex items-center justify-between pb-1 border-b border-gray-100 text-[10px] font-black text-gray-500">
                  <span>ANALYSIS REPORT</span>
                  <span className="text-emerald-700 font-mono">{aiResult.provider}</span>
                </div>
                <div className="text-xs font-medium text-gray-800 leading-relaxed whitespace-pre-line">
                  {aiResult.analysis}
                </div>
              </div>
            )}

            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="md"
              disabled={aiLoading}
              onClick={handleRunAiAnalysis}
              className="py-3"
            >
              <Sparkles size={16} />
              <span>{aiLoading ? 'AI is Analyzing (real LLM call)...' : aiResult ? 'Re-Analyze Room' : 'Analyze Room with AI'}</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Connect Bottom Sheet */}
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

          {listing.contactPhone && (
            <div className="p-3 bg-white border-[2px] border-[#111] rounded-[12px] flex items-center justify-center gap-2 font-mono font-black text-sm">
              <Phone size={16} />
              <span>{listing.contactPhone}</span>
            </div>
          )}

          <div className="p-4 bg-[#E6F9F0] border-[2px] border-[#111] rounded-[14px] text-xs font-bold text-[#111] text-left space-y-1.5">
            <div className="flex items-center gap-1.5 text-green-800 font-black">
              <CheckCircle2 size={16} />
              <span>Contact interest noted!</span>
            </div>
            <p className="text-xs text-gray-600">
              You can message the flatmate directly or invite them into your Flatly Live group.
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
