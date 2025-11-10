export interface ActivitySuggestion {
  title: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  category: string;
  notes: string;
}

export interface PackingCategory {
  [key: string]: string[];
}

export interface GenerateActivitiesRequest {
  destination: string;
  trip_type: string;
  interests: string[];
  pace: 'relaxed' | 'balanced' | 'busy';
  day_index?: number;
  total_days: number;
}

export interface GeneratePackingListRequest {
  destination: string;
  trip_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
}

export async function generateActivities(
  request: GenerateActivitiesRequest
): Promise<ActivitySuggestion[]> {
  const { destination, trip_type, interests, pace, day_index, total_days } = request;

  const activitiesPerDay = {
    relaxed: 3,
    balanced: 4,
    busy: 6,
  };

  const numActivities = activitiesPerDay[pace];

  const activityCategories = [
    'Sightseeing',
    'Dining',
    'Shopping',
    'Entertainment',
    'Activity',
    'Transport',
  ];

  const timeSlots = {
    relaxed: ['09:00', '13:00', '18:00'],
    balanced: ['09:00', '11:30', '14:00', '18:00'],
    busy: ['08:00', '10:00', '12:00', '14:30', '17:00', '19:30'],
  };

  const suggestions: ActivitySuggestion[] = [];

  const destinationActivities: { [key: string]: string[] } = {
    Rome: [
      'Visit the Colosseum',
      'Explore Vatican Museums',
      'Trevi Fountain',
      'Roman Forum Tour',
      'Pantheon Visit',
      'Spanish Steps',
      'Trastevere Walking Tour',
      'Borghese Gallery',
    ],
    Florence: [
      'Uffizi Gallery',
      'Duomo Cathedral',
      'Ponte Vecchio',
      'Accademia Gallery',
      'Boboli Gardens',
      'Piazzale Michelangelo',
    ],
    Paris: [
      'Eiffel Tower',
      'Louvre Museum',
      'Notre-Dame Cathedral',
      'Arc de Triomphe',
      'Montmartre',
      'Seine River Cruise',
    ],
    London: [
      'British Museum',
      'Tower of London',
      'Westminster Abbey',
      'Buckingham Palace',
      'London Eye',
      'Hyde Park',
    ],
    default: [
      'City Walking Tour',
      'Local Museum Visit',
      'Historic District Exploration',
      'Local Market Visit',
      'Scenic Viewpoint',
      'Cultural Performance',
    ],
  };

  const destinationKey = Object.keys(destinationActivities).find((key) =>
    destination.includes(key)
  );
  const baseActivities = destinationKey
    ? destinationActivities[destinationKey]
    : destinationActivities.default;

  const slots = timeSlots[pace];

  for (let i = 0; i < numActivities && i < baseActivities.length; i++) {
    const category = activityCategories[i % activityCategories.length];
    const startTime = slots[i] || '09:00';
    const duration = category === 'Dining' ? 90 : 120;
    const endTime = addMinutes(startTime, duration);

    let activityTitle = baseActivities[i];
    if (interests.includes('food') && i % 3 === 0) {
      activityTitle = `Local ${trip_type === 'Leisure' ? 'Restaurant' : 'Café'} Experience`;
    }

    suggestions.push({
      title: activityTitle,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
      category: category,
      notes: `Suggested activity for ${destination}`,
    });
  }

  return suggestions;
}

export async function generatePackingList(
  request: GeneratePackingListRequest
): Promise<PackingCategory> {
  const { destination, trip_type, duration_days } = request;

  const baseClothing = [
    'T-shirts',
    'Pants/Jeans',
    'Underwear',
    'Socks',
    'Comfortable shoes',
    'Jacket or sweater',
  ];

  const electronics = [
    'Phone charger',
    'Power adapter',
    'Camera',
    'Portable battery',
  ];

  const toiletries = [
    'Toothbrush and toothpaste',
    'Shampoo and soap',
    'Sunscreen',
    'Medications',
    'First aid kit',
  ];

  const documents = [
    'Passport',
    'Travel insurance',
    'Hotel confirmations',
    'Emergency contacts',
    'Credit cards and cash',
  ];

  const packingList: PackingCategory = {
    Clothing: [...baseClothing],
    Electronics: [...electronics],
    Toiletries: [...toiletries],
    Documents: [...documents],
  };

  if (trip_type === 'Adventure') {
    packingList.Clothing.push('Hiking boots', 'Athletic wear', 'Rain jacket');
    packingList['Adventure Gear'] = ['Backpack', 'Water bottle', 'Sunglasses'];
  }

  if (trip_type === 'Business') {
    packingList.Clothing.push('Dress shirt', 'Dress pants', 'Tie', 'Formal shoes');
    packingList['Business Items'] = ['Laptop', 'Business cards', 'Portfolio'];
  }

  if (destination.toLowerCase().includes('beach') || trip_type === 'Leisure') {
    packingList.Clothing.push('Swimsuit', 'Sandals', 'Sun hat');
  }

  if (duration_days > 5) {
    packingList.Miscellaneous = ['Laundry detergent', 'Extra bags for souvenirs'];
  }

  return packingList;
}

function addMinutes(time: string, minutes: number): string {
  const [hours, mins] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMinutes / 60) % 24;
  const newMins = totalMinutes % 60;
  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}
