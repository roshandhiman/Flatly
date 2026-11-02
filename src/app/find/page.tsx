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
  Eye,
  Lightbulb,
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
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

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
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-black text-[#111]">
            Find & Post Rooms 🏠
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-600 mt-0.5">
            Discover verified vacancies with lifestyle compatibility matching
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex gap-2 p-1.5 bg-white border-[2.5px] border-[#111] rounded-[16px] shadow-[4px_4px_0_#111] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-4 py-2 rounded-[12px] font-heading font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
                : 'text-gray-500 hover:text-[#111]'
            }`}
          >
            <Search size={16} strokeWidth={2.5} />
            <span>Browse Rooms ({listings.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('post')}
            className={`px-4 py-2 rounded-[12px] font-heading font-black text-xs md:text-sm flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'post'
                ? 'bg-[#FFD23F] text-[#111] border-[2px] border-[#111] shadow-[2px_2px_0_#111]'
                : 'text-gray-500 hover:text-[#111]'
            }`}
          >
            <PlusCircle size={16} strokeWidth={2.5} />
            <span>Post a Vacancy</span>
          </button>
        </div>
      </div>

      {/* TAB 1: LISTINGS FEED */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Search bar & Filter row */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                placeholder="Search by neighborhood, street, or tags (e.g. Indiranagar, HSR, Furnished)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] text-xs md:text-sm font-bold text-[#111] focus:outline-none placeholder:text-gray-400"
              />
            </div>

            {/* Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none items-center">
              {FILTER_CHIPS.map((chip) => (
                <Chip
                  key={chip}
                  label={chip}
                  selected={activeFilter === chip}
                  onClick={() => setActiveFilter(chip)}
                />
              ))}
            </div>
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
            /* Responsive Grid: 1 col on mobile, 2 cols on tablet, 3 cols on laptop/desktop */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredListings.map((listing) => (
                <div
                  key={listing.id}
                  className="bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[6px_6px_0_#111] overflow-hidden transition-all hover:shadow-[3px_3px_0_#111] hover:translate-x-[2px] hover:translate-y-[2px] flex flex-col justify-between"
                >
                  <div>
                    {/* Top image placeholder with neo-brutal pattern */}
                    <div className="h-36 bg-[#FFD23F]/30 border-b-[2.5px] border-[#111] flex items-center justify-center relative p-3">
                      <div className="text-center">
                        <span className="text-4xl">🏡</span>
                        <span className="block text-[11px] font-black uppercase text-gray-700 mt-1">
                          {listing.location}
                        </span>
                      </div>

                      <span className="absolute top-3 right-3 px-3 py-1 bg-white border-[2px] border-[#111] rounded-full text-[11px] font-black shadow-[2px_2px_0_#111]">
                        {listing.seats} spot{listing.seats > 1 ? 's' : ''} left
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 md:p-5 space-y-3">
                      <div>
                        <h3 className="font-heading font-black text-lg md:text-xl text-[#111] leading-tight line-clamp-1">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mt-1">
                          <MapPin size={14} className="text-[#FF6B57]" />
                          <span className="truncate">{listing.location}</span>
                        </div>
                      </div>

                      {/* Rent & Seats Bar */}
                      <div className="flex items-center justify-between py-2.5 border-y-[1.5px] border-gray-100">
                        <div>
                          <span className="font-heading font-black text-xl md:text-2xl text-[#111]">
                            {formatINR(listing.rent)}
                          </span>
                          <span className="text-xs font-bold text-gray-500">
                            /month
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700 bg-gray-100 px-3 py-1 rounded-[10px] border-[1.5px] border-[#111]">
                          <Bed size={14} />
                          <span>{listing.seats} spot</span>
                        </div>
                      </div>

                      {/* Description Snippet */}
                      <p className="text-xs font-medium text-gray-600 line-clamp-2 leading-relaxed">
                        {listing.description}
                      </p>

                      {/* Tags */}
                      {listing.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {listing.tags.slice(0, 3).map((t) => (
                            <span
                              key={t}
                              className="px-2.5 py-0.5 rounded-[8px] border-[1.5px] border-[#111] text-[10px] font-black bg-[#FFF8EC]"
                            >
                              {t}
                            </span>
                          ))}
                          {listing.tags.length > 3 && (
                            <span className="text-[10px] font-bold text-gray-400 self-center">
                              +{listing.tags.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="p-4 md:p-5 pt-0 flex items-center gap-2">
                    <Link
                      href={`/find/${listing.id}`}
                      className="flex-1 py-2.5 px-4 bg-[#FFD23F] border-[2px] border-[#111] rounded-[12px] shadow-[2.5px_2.5px_0_#111] text-xs font-black text-center hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                    >
                      View Full Details &rarr;
                    </Link>

                    <button
                      onClick={() => deleteListing(listing.id)}
                      className="p-2.5 border-[2px] border-[#111] rounded-[12px] bg-white shadow-[2px_2px_0_#111] text-gray-500 hover:text-red-600 transition-colors cursor-pointer"
                      title="Delete this listing"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: POST A VACANCY FORM (Responsive 2-Col on Laptop/Tablet) */}
      {activeTab === 'post' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (Col 7) */}
          <Card className="lg:col-span-7 bg-white p-5 md:p-7 space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b-[2px] border-[#111]">
              <div className="w-10 h-10 rounded-[12px] bg-[#FFD23F] border-[2px] border-[#111] flex items-center justify-center font-black text-xl shadow-[2px_2px_0_#111]">
                📢
              </div>
              <div>
                <h2 className="font-heading font-black text-lg md:text-xl text-[#111]">
                  Post a Room or Vacancy
                </h2>
                <p className="text-xs font-semibold text-gray-500">
                  Your listing will be published immediately for seekers to view and calculate compatibility
                </p>
              </div>
            </div>

            {createdSuccess && (
              <div className="p-3.5 bg-[#3DDC97] border-[2px] border-[#111] rounded-[12px] text-xs font-black text-[#111] flex items-center gap-2 shadow-[2px_2px_0_#111]">
                <Check size={18} strokeWidth={3} />
                <span>Listing posted successfully! Switching to feed...</span>
              </div>
            )}

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <Input
                label="Listing Headline"
                placeholder="e.g. Cozy Master Bedroom with Balcony in Indiranagar 3BHK"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors({ ...errors, title: '' });
                }}
                error={errors.title}
              />

              <Input
                label="Area / Locality & City"
                placeholder="e.g. Indiranagar 100ft Road, Bangalore"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  if (errors.location) setErrors({ ...errors, location: '' });
                }}
                error={errors.location}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Monthly Rent (₹)"
                  placeholder="e.g. 16500"
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
                label="Description & Roommate Expectations"
                placeholder="Share details about the room, attached washroom, electricity/wifi sharing, quiet hours, and what kind of flatmate you're looking for."
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors({ ...errors, description: '' });
                }}
                error={errors.description}
              />

              {/* Selectable Amenities Tags */}
              <div className="space-y-2">
                <label className="block text-sm font-black text-[#111]">
                  Tags & Amenities (Click to select)
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
                <span>Publish Listing Now</span>
              </Button>
            </form>
          </Card>

          {/* Right Live Preview & Pro-tips (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-5 bg-white border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111]">
              <div className="flex items-center gap-2 mb-3 pb-2 border-b-[2px] border-[#111]">
                <Eye size={18} className="text-[#111]" />
                <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                  Live Preview
                </h3>
              </div>

              {/* Preview Card */}
              <div className="bg-[#FFF8EC] border-[2px] border-[#111] rounded-[16px] overflow-hidden shadow-[3px_3px_0_#111]">
                <div className="h-28 bg-[#FFD23F]/40 border-b-[2px] border-[#111] flex items-center justify-center relative p-3 text-center">
                  <span className="text-3xl">🏡</span>
                  <span className="absolute top-2 right-2 px-2.5 py-0.5 bg-white border-[1.5px] border-[#111] rounded-full text-[10px] font-black">
                    {seats || '1'} spot available
                  </span>
                </div>
                <div className="p-4 space-y-2">
                  <span className="text-lg font-heading font-black text-[#111]">
                    {title.trim() || 'Your Room Title Here'}
                  </span>
                  <p className="text-xs font-semibold text-gray-500">
                    📍 {location.trim() || 'Area, City'}
                  </p>
                  <p className="text-base font-black text-[#111] py-1 border-y border-black/10">
                    {rent ? formatINR(parseFloat(rent) || 0) : '₹0'}/month
                  </p>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {description.trim() || 'Your room description will appear here...'}
                  </p>
                  {selectedTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedTags.map((t) => (
                        <span key={t} className="px-2 py-0.5 text-[10px] font-black bg-white border border-[#111] rounded-md">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pro Tips Card */}
            <div className="p-5 bg-[#6EC6FF] border-[2.5px] border-[#111] rounded-[20px] shadow-[5px_5px_0_#111] space-y-2.5 text-[#111]">
              <div className="flex items-center gap-2">
                <Lightbulb size={20} />
                <h4 className="font-heading font-black text-sm md:text-base">
                  Indian Roommate Matching Tips
                </h4>
              </div>
              <ul className="text-xs font-semibold space-y-2 pl-4 list-disc leading-relaxed">
                <li>Mention food preferences (Veg/Non-veg/Eggetarian) to avoid surprises.</li>
                <li>State deposit amount and lock-in period clearly upfront.</li>
                <li>Add tags like Wi-Fi, Attached Washroom, and No Curfew for 3x higher inquiries.</li>
              </ul>
            </div>
          </div>
        </div>
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
