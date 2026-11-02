'use client';

import { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { formatINR } from '@/lib/utils';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TextArea } from '@/components/ui/TextArea';
import { Chip } from '@/components/ui/Chip';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  Bed,
  Check,
  Filter,
  MapPin,
  Plus,
  PlusCircle,
  Search,
  Sparkles,
  Tag,
  Trash2,
  Users,
} from 'lucide-react';

const AVAILABLE_TAGS = [
  'Fully Furnished',
  'Semi Furnished',
  'Wi-Fi included',
  'No curfew',
  'Pet friendly',
  'Balcony',
  'Attached Washroom',
  'AC available',
];

const FILTER_CHIPS = ['All', 'Under ₹10k', 'Under ₹15k', 'Furnished', 'Pet friendly'];

function FindPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'post' ? 'post' : 'rooms';

  const { listings, addListing, deleteListing } = useStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'post'>(initialTab);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  // Post form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [rent, setRent] = useState('');
  const [seats, setSeats] = useState('1');
  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdSuccess, setCreatedSuccess] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};

    if (!title.trim()) errs.title = 'Title is required (e.g. Sunny Room in Indiranagar)';
    if (!location.trim()) errs.location = 'Location / Area is required';
    const rentNum = parseFloat(rent);
    if (!rent || isNaN(rentNum) || rentNum <= 0) {
      errs.rent = 'Enter a valid monthly rent';
    }
    const seatsNum = parseInt(seats, 10);
    if (!seats || isNaN(seatsNum) || seatsNum <= 0) {
      errs.seats = 'Specify number of spots';
    }
    if (!description.trim()) {
      errs.description = 'Add a quick description about the flat & room';
    }

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    addListing({
      title: title.trim(),
      location: location.trim(),
      rent: rentNum,
      seats: seatsNum,
      description: description.trim(),
      tags: selectedTags,
    });

    // Reset form
    setTitle('');
    setLocation('');
    setRent('');
    setSeats('1');
    setDescription('');
    setSelectedTags([]);
    setErrors({});
    setCreatedSuccess(true);

    setTimeout(() => {
      setCreatedSuccess(false);
      setActiveTab('rooms');
    }, 1200);
  };

  // Filter listings based on search and selected filter chip
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      // Search query filter (title, location, tags)
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filter chip filter
      if (activeFilter === 'Under ₹10k') {
        return item.rent <= 10000;
      }
      if (activeFilter === 'Under ₹15k') {
        return item.rent <= 15000;
      }
      if (activeFilter === 'Furnished') {
        return item.tags.some((t) => t.toLowerCase().includes('furnished'));
      }
      if (activeFilter === 'Pet friendly') {
        return item.tags.some((t) => t.toLowerCase().includes('pet'));
      }

      return true;
    });
  }, [listings, searchQuery, activeFilter]);

  return (
    <div className="p-4 space-y-4">
      {/* Top Header */}
      <div>
        <h1 className="font-heading text-2xl font-black text-[#111]">
          Find & Post Rooms 🏠
        </h1>
        <p className="text-xs font-semibold text-gray-500">
          Discover verified vacancies or find your next flatmate
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1.5 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111]">
        <button
          onClick={() => setActiveTab('rooms')}
          className={`flex-1 py-2 rounded-[12px] font-heading font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'rooms'
              ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <Search size={16} strokeWidth={2.5} />
          <span>Find a Room ({listings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('post')}
          className={`flex-1 py-2 rounded-[12px] font-heading font-black text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'post'
              ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
              : 'text-gray-500 hover:text-[#111]'
          }`}
        >
          <PlusCircle size={16} strokeWidth={2.5} />
          <span>Post Vacancy</span>
        </button>
      </div>

      {/* TAB 1: LISTINGS FEED */}
      {activeTab === 'rooms' && (
        <div className="space-y-3">
          {/* Search bar */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
            />
            <input
              placeholder="Search location or area (e.g. Indiranagar, HSR)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] text-xs font-bold text-[#111] focus:outline-none placeholder:text-gray-400"
            />
          </div>

          {/* Filter Chips */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {FILTER_CHIPS.map((chip) => (
              <Chip
                key={chip}
                label={chip}
                selected={activeFilter === chip}
                onClick={() => setActiveFilter(chip)}
              />
            ))}
          </div>

          {/* Listings count & results */}
          {filteredListings.length === 0 ? (
            listings.length === 0 ? (
              <EmptyState
                emoji="🏘️"
                title="Abhi koi listing nahi!"
                description="Pehli listing post karo. Be the first to list an open room or roommate spot in your flat."
                actionLabel="+ Post First Vacancy"
                onAction={() => setActiveTab('post')}
              />
            ) : (
              <EmptyState
                emoji="🔍"
                title="No matching listings"
                description={`No rooms found matching "${searchQuery || activeFilter}". Try changing your search query.`}
                actionLabel="Clear Filters"
                onAction={() => {
                  setSearchQuery('');
                  setActiveFilter('All');
                }}
              />
            )
          ) : (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white border-[2.5px] border-[#111] rounded-[18px] shadow-[5px_5px_0_#111] overflow-hidden transition-all hover:shadow-[3px_3px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px]"
                >
                  {/* Top image placeholder with neo-brutal pattern */}
                  <div className="h-32 bg-[#FFD23F]/30 border-b-[2px] border-[#111] flex items-center justify-center relative p-3">
                    <div className="text-center">
                      <span className="text-4xl">🏡</span>
                      <span className="block text-[11px] font-black uppercase text-gray-700 mt-1">
                        {listing.location}
                      </span>
                    </div>

                    <span className="absolute top-3 right-3 px-2.5 py-1 bg-white border-[1.5px] border-[#111] rounded-full text-[10px] font-black shadow-[2px_2px_0_#111]">
                      {listing.seats} spot{listing.seats > 1 ? 's' : ''} left
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-heading font-black text-lg text-[#111] leading-tight">
                        {listing.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mt-1">
                        <MapPin size={13} className="text-[#FF6B57]" />
                        <span>{listing.location}</span>
                      </div>
                    </div>

                    {/* Rent & Seats Bar */}
                    <div className="flex items-center justify-between py-2 border-y-[1.5px] border-gray-100">
                      <div>
                        <span className="font-heading font-black text-xl text-[#111]">
                          {formatINR(listing.rent)}
                        </span>
                        <span className="text-xs font-bold text-gray-500">
                          /month
                        </span>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-[8px] border border-[#111]">
                        <Bed size={14} />
                        <span>{listing.seats} room available</span>
                      </div>
                    </div>

                    {/* Tags */}
                    {listing.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {listing.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-[6px] border-[1.5px] border-[#111] text-[10px] font-bold bg-[#FFF8EC]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1">
                      <Link
                        href={`/find/${listing.id}`}
                        className="flex-1 py-2 px-3 bg-[#FFD23F] border-[2px] border-[#111] rounded-[10px] shadow-[2px_2px_0_#111] text-xs font-black text-center hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        View Full Details &rarr;
                      </Link>

                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="p-2 border-[2px] border-[#111] rounded-[10px] bg-white shadow-[2px_2px_0_#111] text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                        title="Delete this listing"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POST A VACANCY FORM */}
      {activeTab === 'post' && (
        <Card className="bg-white space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b-[2px] border-[#111]">
            <div className="w-8 h-8 rounded-[8px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center font-black">
              📢
            </div>
            <div>
              <h2 className="font-heading font-black text-base text-[#111]">
                Post a Room or Vacancy
              </h2>
              <p className="text-[11px] font-semibold text-gray-500">
                Created listings will appear instantly in the feed
              </p>
            </div>
          </div>

          {createdSuccess && (
            <div className="p-3 bg-[#3DDC97] border-[2px] border-[#111] rounded-[10px] text-xs font-black text-[#111] flex items-center gap-1.5">
              <Check size={16} strokeWidth={3} />
              <span>Listing posted successfully! Switching to feed...</span>
            </div>
          )}

          <form onSubmit={handlePostSubmit} className="space-y-4">
            <Input
              label="Listing Headline"
              placeholder="e.g. Cozy Sunny Room in Indiranagar 1BHK/3BHK"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (errors.title) setErrors({ ...errors, title: '' });
              }}
              error={errors.title}
            />

            <Input
              label="Area / Neighborhood"
              placeholder="e.g. Indiranagar 100ft Road, Bangalore"
              value={location}
              onChange={(e) => {
                setLocation(e.target.value);
                if (errors.location) setErrors({ ...errors, location: '' });
              }}
              error={errors.location}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Monthly Rent (₹)"
                placeholder="e.g. 14500"
                type="number"
                value={rent}
                onChange={(e) => {
                  setRent(e.target.value);
                  if (errors.rent) setErrors({ ...errors, rent: '' });
                }}
                error={errors.rent}
              />

              <Input
                label="Spots Available"
                placeholder="e.g. 1"
                type="number"
                value={seats}
                onChange={(e) => {
                  setSeats(e.target.value);
                  if (errors.seats) setErrors({ ...errors, seats: '' });
                }}
                error={errors.seats}
              />
            </div>

            <TextArea
              label="Description & Roommate Vibe"
              placeholder="Tell about the flat, amenities, nearby metro, and what kind of flatmate you're looking for."
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                if (errors.description) setErrors({ ...errors, description: '' });
              }}
              error={errors.description}
            />

            {/* Selectable Amenities Tags */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#111]">
                Tags & Amenities (Tap to select)
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TAGS.map((t) => (
                  <Chip
                    key={t}
                    label={t}
                    selected={selectedTags.includes(t)}
                    onClick={() => toggleTag(t)}
                  />
                ))}
              </div>
            </div>

            <Button type="submit" variant="primary" fullWidth size="lg">
              <Sparkles size={18} />
              <span>Publish Listing</span>
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}

export default function FindPage() {
  return (
    <Suspense fallback={<div className="p-4 text-center font-bold">Loading...</div>}>
      <FindPageContent />
    </Suspense>
  );
}

