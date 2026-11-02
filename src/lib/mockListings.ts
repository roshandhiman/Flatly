import { Listing } from './types';

export const MOCK_LISTINGS: Listing[] = [
  {
    id: 'room-blr-1',
    title: 'Master Bedroom with Private Balcony in 3BHK',
    location: '12th Main, Indiranagar, Bengaluru',
    city: 'Bengaluru',
    area: 'Indiranagar',
    coordinates: { lat: 12.9719, lng: 77.6412 },
    rent: 18500,
    seats: 1,
    description: 'Looking for a chill roommate for a spacious master bedroom with an attached bath and private balcony in Indiranagar. Walking distance to 100ft road cafes, metro station, and Toit. House has high-speed fiber, maid for daily cooking and cleaning, and a fully functional kitchen with microwave and chimney.',
    tags: ['Attached Washroom', 'Private Balcony', 'Fully Furnished', 'Wi-Fi included', 'AC available', 'No curfew'],
    imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.9,
    reviewCount: 8,
    reviews: [
      {
        id: 'rev-1',
        author: 'Arjun Verma',
        rating: 5,
        comment: 'Lived here for 6 months before relocating to London. Indiranagar metro is 4 min walk and the cook is amazing!',
        date: '2026-02-14',
        avatarColor: '#FFD23F'
      },
      {
        id: 'rev-2',
        author: 'Sneha Patel',
        rating: 5,
        comment: 'Super peaceful balcony for evening tea. Flatmates work in tech and respect quiet hours.',
        date: '2026-01-20',
        avatarColor: '#3DDC97'
      }
    ],
    contactName: 'Rohan Sharma',
    contactPhone: '+91 98450 12345',
    createdAt: '2026-02-15T10:00:00.000Z'
  },
  {
    id: 'room-blr-2',
    title: 'Cozy Room in Koramangala 5th Block Startup Hub',
    location: 'Near Jyoti Nivas College, Koramangala, Bengaluru',
    city: 'Bengaluru',
    area: 'Koramangala',
    coordinates: { lat: 12.9352, lng: 77.6245 },
    rent: 14000,
    seats: 1,
    description: '1 room vacant in a chill 2BHK flat. Ideal for founders, remote tech workers, or designers. We have 300 Mbps Airtel Xstream, dual workspace desks, PS5 in living room, and zero broker interference. Water filter, washing machine, and fridge included.',
    tags: ['Fully Furnished', 'Wi-Fi included', 'No curfew', 'Work Desk', 'Pet friendly'],
    imageUrl: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.8,
    reviewCount: 6,
    reviews: [
      {
        id: 'rev-3',
        author: 'Kunal Roy',
        rating: 5,
        comment: 'Great vibe for anyone working remotely. Cafes like Third Wave and Blue Tokai are right around the corner.',
        date: '2026-02-01',
        avatarColor: '#6EC6FF'
      }
    ],
    contactName: 'Vikram Joshi',
    contactPhone: '+91 98110 54321',
    createdAt: '2026-02-10T14:30:00.000Z'
  },
  {
    id: 'room-blr-3',
    title: 'Gated Society Room in HSR Sector 3 with Gym & Pool',
    location: 'Sector 3, HSR Layout, Bengaluru',
    city: 'Bengaluru',
    area: 'HSR Layout',
    coordinates: { lat: 12.9116, lng: 77.6389 },
    rent: 16000,
    seats: 2,
    description: 'Shared 2-spot room in premium gated society in HSR. Society features 24x7 security, power backup, clubhouse gym, swimming pool, and underground parking. Flat is fully loaded with brand new washing machine, water purifier, and high-speed broadband.',
    tags: ['Gated Society', 'Gym & Pool', 'Power Backup', 'AC available', 'Attached Washroom'],
    imageUrl: 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.7,
    reviewCount: 11,
    reviews: [
      {
        id: 'rev-4',
        author: 'Meera Nair',
        rating: 5,
        comment: 'Very safe society for women. 24h security guards and supermarket inside the premises.',
        date: '2026-01-18',
        avatarColor: '#FF6B57'
      }
    ],
    contactName: 'Priya Sundaram',
    contactPhone: '+91 97400 98765',
    createdAt: '2026-02-12T09:15:00.000Z'
  },
  {
    id: 'room-blr-4',
    title: 'Modern Single Room near EcoSpace & RMZ Bellandur',
    location: 'Outer Ring Road, Bellandur, Bengaluru',
    city: 'Bengaluru',
    area: 'Bellandur',
    coordinates: { lat: 12.9260, lng: 77.6762 },
    rent: 13500,
    seats: 1,
    description: 'Save 2 hours on Bangalore traffic! Only 5 mins from EcoSpace and RMZ Ecoworld. 1 single private room with wardrobe, study table, and ergonomic chair. Flatmates work at Flipkart & Amazon. Equal split for electricity and maid.',
    tags: ['Near Tech Park', 'Semi Furnished', 'Wi-Fi included', 'Attached Washroom'],
    imageUrl: 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.6,
    reviewCount: 5,
    reviews: [
      {
        id: 'rev-5',
        author: 'Deepak Sen',
        rating: 5,
        comment: 'Literally walked to office every morning. Saved so much auto money!',
        date: '2026-01-25',
        avatarColor: '#FFD23F'
      }
    ],
    contactName: 'Amit Bansal',
    contactPhone: '+91 99001 22334',
    createdAt: '2026-02-08T11:00:00.000Z'
  },
  {
    id: 'room-bom-1',
    title: 'Sea Breeze Room in Bandra West near Carter Road',
    location: 'Off Carter Road, Bandra West, Mumbai',
    city: 'Mumbai',
    area: 'Bandra West',
    coordinates: { lat: 19.0607, lng: 72.8258 },
    rent: 28000,
    seats: 1,
    description: 'Charming sunlit room in a heritage Bandra apartment. 2 mins walk from Carter Road promenade and jogging track. Fully renovated interiors with teak wood flooring, split AC, smart TV, and modular kitchen. Looking for a respectful, clean roommate.',
    tags: ['Sea View', 'Fully Furnished', 'AC available', 'Pet friendly', 'No curfew'],
    imageUrl: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 5.0,
    reviewCount: 14,
    reviews: [
      {
        id: 'rev-6',
        author: 'Tanya Merchant',
        rating: 5,
        comment: 'The location is unbeatable in Mumbai. Sunset walks on Carter Road every evening.',
        date: '2026-02-18',
        avatarColor: '#FF6B57'
      },
      {
        id: 'rev-7',
        author: 'Rishi Kapoor',
        rating: 5,
        comment: 'High speed wifi, super cool roommates in media/advertising. 10/10.',
        date: '2026-02-05',
        avatarColor: '#3DDC97'
      }
    ],
    contactName: 'Zara Khan',
    contactPhone: '+91 98200 44556',
    createdAt: '2026-02-14T16:00:00.000Z'
  },
  {
    id: 'room-bom-2',
    title: 'High-Rise 2BHK Room with Powai Lake View in Hiranandani',
    location: 'Hiranandani Gardens, Powai, Mumbai',
    city: 'Mumbai',
    area: 'Powai',
    coordinates: { lat: 19.1176, lng: 72.9060 },
    rent: 22000,
    seats: 1,
    description: '18th floor bedroom in neo-classical Hiranandani building. Spectacular Powai lake views, 100% power backup, piped gas, and gated township with cafes, banks, and grocery stores downstairs. Flatmates are IIT Bombay alumni.',
    tags: ['Lake View', 'High Rise', 'Power Backup', 'Gym & Pool', 'Attached Washroom'],
    imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.9,
    reviewCount: 9,
    reviews: [
      {
        id: 'rev-8',
        author: 'Siddharth Dave',
        rating: 5,
        comment: 'Hiranandani architecture makes you feel like you are in Europe. Very quiet and green.',
        date: '2026-01-30',
        avatarColor: '#6EC6FF'
      }
    ],
    contactName: 'Abhishek Iyer',
    contactPhone: '+91 98330 66778',
    createdAt: '2026-02-11T12:00:00.000Z'
  },
  {
    id: 'room-bom-3',
    title: 'Spacious Room in Lokhandwala Complex, Andheri West',
    location: 'Lokhandwala Back Road, Andheri West, Mumbai',
    city: 'Mumbai',
    area: 'Andheri West',
    coordinates: { lat: 19.1417, lng: 72.8272 },
    rent: 19500,
    seats: 1,
    description: 'Master room available in 3BHK Lokhandwala. Metro line 2A station is 5 mins away. Surrounded by markets, gyms, and top food joints. Flat comes with double bed, 4-door wardrobe, inverter, and microwave.',
    tags: ['Attached Washroom', 'Fully Furnished', 'AC available', 'Balcony'],
    imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.7,
    reviewCount: 7,
    reviews: [
      {
        id: 'rev-9',
        author: 'Aditya Roy',
        rating: 5,
        comment: 'Jogging track at Lokhandwala back road is right outside. Very lively neighborhood!',
        date: '2026-02-02',
        avatarColor: '#FFD23F'
      }
    ],
    contactName: 'Karan Mehra',
    contactPhone: '+91 98210 99887',
    createdAt: '2026-02-09T18:00:00.000Z'
  },
  {
    id: 'room-del-1',
    title: 'Luxury Room with Terrace in DLF Phase 3 near Cyber City',
    location: 'U-Block, DLF Phase 3, Gurugram, Delhi NCR',
    city: 'Delhi NCR',
    area: 'Gurugram',
    coordinates: { lat: 28.4986, lng: 77.0878 },
    rent: 16500,
    seats: 1,
    description: 'Looking for a flatmate in a newly built independent floor in DLF Phase 3. Rapid metro station is 300 meters away. Walking access to Cyber Hub and DLF Cyber City. Includes 1.5 ton Inverter AC, geyser, smart LED TV, and rooftop terrace.',
    tags: ['Rapid Metro', 'Terrace Access', 'Fully Furnished', 'AC available', 'Power Backup'],
    imageUrl: 'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.9,
    reviewCount: 12,
    reviews: [
      {
        id: 'rev-10',
        author: 'Gaurav Chopra',
        rating: 5,
        comment: 'Saves crazy Gurugram commute time. Cyber Hub for dinner and drinks is just a quick stroll.',
        date: '2026-02-16',
        avatarColor: '#3DDC97'
      }
    ],
    contactName: 'Nitin Kaushik',
    contactPhone: '+91 98101 77665',
    createdAt: '2026-02-13T08:00:00.000Z'
  },
  {
    id: 'room-del-2',
    title: 'Boho Studio Room in Hauz Khas Village overlooking Deer Park',
    location: 'Hauz Khas Village, South Delhi',
    city: 'Delhi NCR',
    area: 'Hauz Khas',
    coordinates: { lat: 28.5535, lng: 77.1944 },
    rent: 21000,
    seats: 1,
    description: 'Artist / freelancer friendly private room with aesthetic wooden exposed brickwork and direct views of Deer Park and Hauz Khas fort. Yellow Line Metro (Green Park / Hauz Khas) nearby. Safe for women, pet friendly, and open-minded co-livers.',
    tags: ['Park View', 'Heritage Area', 'Pet friendly', 'Wi-Fi included', 'No curfew'],
    imageUrl: 'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 5.0,
    reviewCount: 15,
    reviews: [
      {
        id: 'rev-11',
        author: 'Ananya Sen',
        rating: 5,
        comment: 'Waking up to peacock sounds in South Delhi! Beautiful natural light all day long.',
        date: '2026-02-09',
        avatarColor: '#FF6B57'
      }
    ],
    contactName: 'Divya Singhal',
    contactPhone: '+91 99100 33442',
    createdAt: '2026-02-15T15:00:00.000Z'
  },
  {
    id: 'room-del-3',
    title: 'Budget-Friendly Room in Sector 62 near Tech Parks',
    location: 'Sector 62, Noida, Delhi NCR',
    city: 'Delhi NCR',
    area: 'Noida',
    coordinates: { lat: 28.6280, lng: 77.3649 },
    rent: 9500,
    seats: 1,
    description: 'Super pocket-friendly room in Sector 62, Noida. 500m from Electronic City Metro Station and Symbiosis / JSS colleges. Blue line metro connectivity to Central Delhi. Includes 100 Mbps Wi-Fi, RO water, and geyser.',
    tags: ['Under ₹10k', 'Near Metro', 'Wi-Fi included', 'Semi Furnished'],
    imageUrl: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.5,
    reviewCount: 4,
    reviews: [
      {
        id: 'rev-12',
        author: 'Rohit Mishra',
        rating: 4,
        comment: 'Best value for money in Noida. Electricity bill is very low.',
        date: '2026-01-15',
        avatarColor: '#FFD23F'
      }
    ],
    contactName: 'Manish Tyagi',
    contactPhone: '+91 98711 44332',
    createdAt: '2026-02-05T10:00:00.000Z'
  },
  {
    id: 'room-pun-1',
    title: 'Penthouse Room with Sky Deck in Viman Nagar',
    location: 'Symbiosis Road, Viman Nagar, Pune',
    city: 'Pune',
    area: 'Viman Nagar',
    coordinates: { lat: 18.5679, lng: 73.9143 },
    rent: 14500,
    seats: 1,
    description: 'Looking for a flatmate in an awesome penthouse in Viman Nagar. Phoenix Marketcity is 5 mins walk. Huge open terrace, barbecue setup, high-speed fiber internet, and daily house maid. Flatmates work in fintech and IT.',
    tags: ['Sky Terrace', 'Near Mall', 'Fully Furnished', 'Wi-Fi included', 'No curfew'],
    imageUrl: 'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.8,
    reviewCount: 9,
    reviews: [
      {
        id: 'rev-13',
        author: 'Pranav Kulkarni',
        rating: 5,
        comment: 'Terrace parties on weekends and great cook on weekdays. Loved my time here!',
        date: '2026-02-11',
        avatarColor: '#3DDC97'
      }
    ],
    contactName: 'Tanmay Deshmukh',
    contactPhone: '+91 98900 11223',
    createdAt: '2026-02-10T16:00:00.000Z'
  },
  {
    id: 'room-pun-2',
    title: 'Gated Villa Room in Baner with Garden & High-Speed Net',
    location: 'Baner-Pashan Link Road, Baner, Pune',
    city: 'Pune',
    area: 'Baner',
    coordinates: { lat: 18.5590, lng: 73.7868 },
    rent: 12500,
    seats: 2,
    description: 'Peaceful garden villa in Baner. Direct highway connectivity to Hinjewadi IT Park (Phase 1/2/3). Solar water heater, inverter power backup, parking for both 2-wheelers and cars. Peaceful green surroundings.',
    tags: ['Near Hinjewadi', 'Garden View', 'Power Backup', 'Parking', 'Semi Furnished'],
    imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80'
    ],
    rating: 4.7,
    reviewCount: 7,
    reviews: [
      {
        id: 'rev-14',
        author: 'Shubham Patil',
        rating: 5,
        comment: 'Hinjewadi commute is barely 15 mins. Lots of open greenery.',
        date: '2026-01-28',
        avatarColor: '#6EC6FF'
      }
    ],
    contactName: 'Omkar Shinde',
    contactPhone: '+91 98600 55667',
    createdAt: '2026-02-07T11:00:00.000Z'
  }
];

