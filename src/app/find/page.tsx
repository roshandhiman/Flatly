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
  Grid,
  Map as MapIcon,
  MapPin,
  Plus,
  PlusCircle,
  Search,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Users,
  Eye,
  Navigation,
  Building2
} from 'lucide-react';
import { Listing } from '@/lib/types';

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
const CITIES = ['All Cities', 'Bengaluru', 'Mumbai', 'Delhi NCR', 'Pune'];

function FindPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'post' ? 'post' : 'rooms';

  const { listings, addListing, deleteListing } = useStore();
  const [activeTab, setActiveTab] = useState<'rooms' | 'post'>(initialTab);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All Cities');

  // Map state
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null);

  // Post form state
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [city, setCity] = useState('Bengaluru');
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
      city,
      rent: rentNum,
      seats: seatsNum,
      description: description.trim(),
      tags: selectedTags,
      imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      rating: 5.0,
      reviewCount: 1,
      reviews: [],
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

  // Filter listings based on search, city, and selected filter chip
  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      const matchesSearch =
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedCity !== 'All Cities') {
        const itemCity = item.city || '';
        const inCity =
          itemCity.toLowerCase() === selectedCity.toLowerCase() ||
          item.location.toLowerCase().includes(selectedCity.toLowerCase());
        if (!inCity) return false;
      }

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
  }, [listings, searchQuery, selectedCity, activeFilter]);

  const activePinListing = useMemo(() => {
    return filteredListings.find((l) => l.id === selectedPinId) || filteredListings[0];
  }, [filteredListings, selectedPinId]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading font-black text-2xl md:text-3xl text-[#111]">
            Find &amp; Post Rooms 🏠
          </h1>
          <p className="text-xs md:text-sm font-semibold text-gray-600 mt-0.5">
            Discover verified vacancies with lifestyle compatibility matching &amp; neighborhood maps
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

      {/* TAB 1: LISTINGS FEED / MAP */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Controls Bar: Search + City Filters + View Mode Toggle */}
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="relative flex-1">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500"
                />
                <input
                  placeholder="Search neighborhood, street, or tags (e.g. Indiranagar, Bandra, Powai, Furnished)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] text-xs md:text-sm font-bold text-[#111] focus:outline-none placeholder:text-gray-400"
                />
              </div>

              {/* View Mode Toggle (Grid vs Map) */}
              <div className="flex items-center gap-1 bg-white p-1 border-[2.5px] border-[#111] rounded-[14px] shadow-[3px_3px_0_#111] self-start md:self-auto">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-heading font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-[#FFD23F] text-[#111] border border-[#111] shadow-[1px_1px_0_#111]'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <Grid size={14} />
                  <span>Grid</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-3 py-1.5 rounded-[10px] text-xs font-heading font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'map'
                      ? 'bg-[#3DDC97] text-[#111] border border-[#111] shadow-[1px_1px_0_#111]'
                      : 'text-gray-600 hover:text-black'
                  }`}
                >
                  <MapIcon size={14} />
                  <span>Map View 🗺️</span>
                </button>
              </div>
            </div>

            {/* City Tabs & Price Filters */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* City Selection */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 items-center">
                <span className="text-[11px] font-black uppercase text-gray-400 mr-1 flex items-center gap-1">
                  <MapPin size={12} /> City:
                </span>
                {CITIES.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedCity(c)}
                    className={`px-3 py-1 rounded-full text-xs font-black border-[1.5px] border-[#111] transition-all cursor-pointer ${
                      selectedCity === c
                        ? 'bg-[#FFD23F] text-[#111] shadow-[2px_2px_0_#111]'
                        : 'bg-white text-gray-700 hover:bg-gray-100 shadow-[1px_1px_0_#111]'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              {/* Filter Chips */}
              <div className="flex gap-1.5 overflow-x-auto items-center">
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
          </div>

          {/* VIEW MODE: MAP VIEW */}
          {viewMode === 'map' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Visual Interactive Map Canvas (Col 8) */}
                <div className="lg:col-span-8 bg-[#E6F4EA] border-[3px] border-[#111] rounded-[24px] shadow-[8px_8px_0_#111] p-5 md:p-6 space-y-4 relative overflow-hidden min-h-[480px]">
                  {/* Map Header info */}
                  <div className="flex items-center justify-between pb-3 border-b-[2px] border-[#111]">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">🗺️</span>
                      <div>
                        <h3 className="font-heading font-black text-sm md:text-base text-[#111]">
                          Interactive Neighborhood Map ({filteredListings.length} Rooms Nearby)
                        </h3>
                        <p className="text-[11px] font-bold text-gray-600">
                          Click any location pin to inspect room details &amp; compatibility
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-white border-[1.5px] border-[#111] rounded-full text-xs font-black shadow-[1.5px_1.5px_0_#111]">
                      {selectedCity}
                    </span>
                  </div>

                  {/* Stylized Neo-Brutalist Visual Map Graphic with Interactive Pins */}
                  <div className="relative w-full h-[360px] bg-[#D4EDDA] border-[2px] border-[#111] rounded-[18px] overflow-hidden shadow-[inner_0_2px_8px_rgba(0,0,0,0.1)]">
                    {/* Road Network Lines Background */}
                    <svg className="absolute inset-0 w-full h-full opacity-35" xmlns="http://www.w3.org/2000/svg">
                      <line x1="0" y1="120" x2="800" y2="150" stroke="#111" strokeWidth="8" />
                      <line x1="180" y1="0" x2="220" y2="400" stroke="#111" strokeWidth="6" />
                      <line x1="450" y1="0" x2="480" y2="400" stroke="#111" strokeWidth="6" />
                      <line x1="0" y1="280" x2="800" y2="250" stroke="#111" strokeWidth="7" />
                      <circle cx="200" cy="130" r="26" fill="#A3D9A5" stroke="#111" strokeWidth="3" />
                      <circle cx="470" cy="260" r="30" fill="#A3D9A5" stroke="#111" strokeWidth="3" />
                      {/* River / Lake */}
                      <path d="M 0,40 Q 300,90 600,40 T 900,80" fill="none" stroke="#6EC6FF" strokeWidth="16" />
                    </svg>

                    {/* Plotted Interactive Room Pins */}
                    {filteredListings.map((listing, idx) => {
                      // Deterministic position inside map box
                      const xPct = 12 + ((idx * 27) % 76);
                      const yPct = 15 + ((idx * 33) % 70);
                      const isSelected = listing.id === activePinListing?.id;

                      return (
                        <button
                          key={listing.id}
                          type="button"
                          onClick={() => setSelectedPinId(listing.id)}
                          style={{ left: `${xPct}%`, top: `${yPct}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 transition-all cursor-pointer z-20 group ${
                            isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                          }`}
                        >
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full border-[2px] border-[#111] text-xs font-black shadow-[2.5px_2.5px_0_#111] transition-colors ${
                            isSelected
                              ? 'bg-[#FFD23F] text-[#111] ring-2 ring-black'
                              : 'bg-white text-gray-800 group-hover:bg-[#FFD23F]'
                          }`}>
                            <MapPin size={13} className={isSelected ? 'text-[#FF6B57]' : 'text-blue-600'} />
                            <span>{formatINR(listing.rent)}</span>
                          </div>
                        </button>
                      );
                    })}

                    <div className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-xs border-[1.5px] border-[#111] rounded-full text-[10px] font-black shadow-[1px_1px_0_#111]">
                      📍 {filteredListings.length} rooms mapped across {selectedCity}
                    </div>
                  </div>
                </div>

                {/* Selected Room Focus Card (Col 4) */}
                <div className="lg:col-span-4 space-y-4">
                  {activePinListing ? (
                    <div className="bg-white border-[3px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] overflow-hidden space-y-3 p-4">
                      <div className="relative h-44 rounded-[16px] border-[2px] border-[#111] overflow-hidden shadow-[2px_2px_0_#111]">
                        <img
                          src={activePinListing.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
                          alt={activePinListing.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 right-2 px-2.5 py-0.5 bg-white border border-[#111] rounded-full text-[10px] font-black shadow-[1px_1px_0_#111]">
                          {activePinListing.seats} spot{activePinListing.seats > 1 ? 's' : ''} left
                        </span>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-black/80 text-white rounded-full text-[10px] font-bold">
                          <Star size={11} className="fill-[#FFD23F] text-[#FFD23F]" />
                          <span>{activePinListing.rating || 4.8}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-heading font-black text-2xl text-[#111]">
                            {formatINR(activePinListing.rent)}
                            <span className="text-xs font-bold text-gray-500">/mo</span>
                          </span>
                          <span className="text-[11px] font-bold text-gray-500">
                            {activePinListing.city || 'Bengaluru'}
                          </span>
                        </div>

                        <h4 className="font-heading font-black text-sm text-[#111] line-clamp-1">
                          {activePinListing.title}
                        </h4>
                        <p className="text-xs font-semibold text-gray-600 line-clamp-2">
                          {activePinListing.location}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1 pt-1">
                        {activePinListing.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 rounded-[6px] border border-[#111] text-[9px] font-black bg-[#FFF8EC]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <Link
                        href={`/find/${activePinListing.id}`}
                        className="block w-full py-2.5 bg-[#FFD23F] border-[2px] border-[#111] rounded-[12px] font-heading font-black text-xs text-center shadow-[2px_2px_0_#111] hover:bg-[#ffe17d] transition-colors"
                      >
                        View Full Room &amp; Reviews &rarr;
                      </Link>
                    </div>
                  ) : (
                    <div className="p-6 bg-white border-[2px] border-[#111] rounded-[20px] text-center text-xs font-bold text-gray-500">
                      Click a pin to view room details
                    </div>
                  )}

                  {/* Quick Nearby Rooms List */}
                  <div className="p-4 bg-[#FFF8EC] border-[2px] border-[#111] rounded-[20px] shadow-[4px_4px_0_#111] space-y-2">
                    <h5 className="font-heading font-black text-xs uppercase tracking-wider text-gray-600">
                      All Nearby Rooms in {selectedCity}
                    </h5>
                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {filteredListings.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedPinId(l.id)}
                          className={`w-full p-2.5 rounded-[12px] border-[1.5px] border-[#111] text-left transition-all cursor-pointer flex items-center justify-between ${
                            l.id === activePinListing?.id
                              ? 'bg-[#FFD23F] shadow-[1.5px_1.5px_0_#111]'
                              : 'bg-white hover:bg-gray-50'
                          }`}
                        >
                          <div className="min-w-0 pr-2">
                            <div className="text-xs font-black truncate text-[#111]">{l.title}</div>
                            <div className="text-[10px] text-gray-600 truncate">{l.location}</div>
                          </div>
                          <span className="text-xs font-black font-mono flex-shrink-0">
                            {formatINR(l.rent)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VIEW MODE: GRID VIEW */}
          {viewMode === 'grid' && (
            <div>
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
                    description={`No rooms found matching "${searchQuery || activeFilter}". Try changing your city or search query.`}
                    actionLabel="Clear Filters"
                    onAction={() => {
                      setSearchQuery('');
                      setActiveFilter('All');
                      setSelectedCity('All Cities');
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
                        {/* Real Photo Header */}
                        <div className="relative h-48 bg-gray-100 border-b-[2.5px] border-[#111] overflow-hidden">
                          <img
                            src={listing.imageUrl || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'}
                            alt={listing.title}
                            className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          />

                          <div className="absolute top-3 left-3 flex gap-1.5">
                            {listing.city && (
                              <span className="px-2.5 py-0.5 bg-[#FFD23F] border border-[#111] rounded-full text-[10px] font-black shadow-[1.5px_1.5px_0_#111]">
                                📍 {listing.city}
                              </span>
                            )}
                          </div>

                          <span className="absolute top-3 right-3 px-3 py-1 bg-white border-[2px] border-[#111] rounded-full text-[11px] font-black shadow-[2px_2px_0_#111]">
                            {listing.seats} spot{listing.seats > 1 ? 's' : ''} left
                          </span>

                          {/* Rating Pill */}
                          <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-black/80 backdrop-blur-xs text-white rounded-full text-[11px] font-bold border border-white/20">
                            <Star size={12} className="fill-[#FFD23F] text-[#FFD23F]" />
                            <span className="font-black">{listing.rating || 4.8}</span>
                            <span className="text-gray-300">({listing.reviewCount || 6})</span>
                          </div>
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
                          View Room &amp; Reviews &rarr;
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
        </div>
      )}

      {/* TAB 2: POST A VACANCY FORM */}
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
              <div className="p-3.5 bg-[#3DDC97] border-[2px] border-[#111] rounded-[14px] text-xs font-black text-[#111] flex items-center gap-2 shadow-[3px_3px_0_#111]">
                <Check size={18} strokeWidth={3} />
                <span>Vacant room published to Flatly feed! Redirecting...</span>
              </div>
            )}

            <form onSubmit={handlePostSubmit} className="space-y-4">
              <Input
                label="Listing Title *"
                placeholder="e.g. Master Bedroom with Balcony in Indiranagar 3BHK"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors((prev) => ({ ...prev, title: '' }));
                }}
                error={errors.title}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase text-gray-700 block mb-1">
                    City *
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-bold bg-[#FFF8EC] border-[2px] border-[#111] rounded-[12px] shadow-[2px_2px_0_#111] focus:outline-none"
                  >
                    <option value="Bengaluru">Bengaluru</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Delhi NCR">Delhi NCR</option>
                    <option value="Pune">Pune</option>
                  </select>
                </div>

                <Input
                  label="Area / Neighborhood *"
                  placeholder="e.g. 100ft Road, Indiranagar"
                  value={location}
                  onChange={(e) => {
                    setLocation(e.target.value);
                    if (errors.location) setErrors((prev) => ({ ...prev, location: '' }));
                  }}
                  error={errors.location}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Monthly Rent (₹) *"
                  type="number"
                  placeholder="e.g. 15000"
                  value={rent}
                  onChange={(e) => {
                    setRent(e.target.value);
                    if (errors.rent) setErrors((prev) => ({ ...prev, rent: '' }));
                  }}
                  error={errors.rent}
                />

                <Input
                  label="Spots Available *"
                  type="number"
                  min="1"
                  max="10"
                  placeholder="1"
                  value={seats}
                  onChange={(e) => {
                    setSeats(e.target.value);
                    if (errors.seats) setErrors((prev) => ({ ...prev, seats: '' }));
                  }}
                  error={errors.seats}
                />
              </div>

              <TextArea
                label="Room & Flat Description *"
                placeholder="Describe your flat culture, current roommates, kitchen setup, Wi-Fi speed, cook/maid status, and house rules..."
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
                }}
                error={errors.description}
              />

              {/* Tag selector */}
              <div className="space-y-2">
                <label className="font-heading font-black text-xs uppercase tracking-wider text-gray-500 block">
                  Select Features &amp; Amenities
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVAILABLE_TAGS.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      selected={selectedTags.includes(tag)}
                      onClick={() => toggleTag(tag)}
                    />
                  ))}
                </div>
              </div>

              <Button type="submit" variant="primary" fullWidth size="lg">
                <Plus size={18} />
                <span>Publish Listing to Feed</span>
              </Button>
            </form>
          </Card>

          {/* Right Preview & Tips (Col 5) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 bg-[#FFD23F] border-[2.5px] border-[#111] rounded-[24px] shadow-[6px_6px_0_#111] space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles size={20} />
                <h3 className="font-heading font-black text-base text-[#111]">
                  Tips for Fast Flatmate Matching
                </h3>
              </div>
              <ul className="text-xs font-semibold text-gray-800 space-y-2 list-disc pl-4 leading-relaxed">
                <li>Mention proximity to tech parks, metro stations, and grocery stores.</li>
                <li>Be upfront about dietary preferences (pure veg vs non-veg).</li>
                <li>List shared costs (cook, maid, Wi-Fi) so there are no surprises.</li>
                <li>High compatibility roommates lead to 70% lower flat turnover!</li>
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
    <Suspense fallback={<div className="p-8 text-center font-bold">Loading rooms &amp; map...</div>}>
      <FindPageContent />
    </Suspense>
  );
}
