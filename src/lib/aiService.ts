export interface ActivitySuggestion {
  title: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  category: string;
  notes: string;
  location?: string;
  location_lat?: number;
  location_lon?: number;
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
  startingLocation?: string;
  startingCoords?: { lat: number; lon: number };
}

export interface GeneratePackingListRequest {
  destination: string;
  trip_type: string;
  duration_days: number;
  start_date: string;
  end_date: string;
}

interface WikipediaPlace {
  title: string;
  description: string;
  coordinates?: { lat: number; lon: number };
}

async function getCoordinates(destination: string): Promise<{ lat: number; lon: number } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json&limit=1`,
      {
        headers: {
          'User-Agent': 'SmartTrip/1.0',
        },
      }
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
    }
  } catch (error) {
    console.error('Error fetching coordinates:', error);
  }
  return null;
}

async function getNearbyPlaces(
  destination: string,
  interests: string[],
  startingCoords?: { lat: number; lon: number }
): Promise<WikipediaPlace[]> {
  try {
    let coords = startingCoords;

    if (!coords) {
      coords = await getCoordinates(destination);
    }

    if (!coords) return [];

    const radius = startingCoords ? 3000 : 10000;

    const response = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${coords.lat}|${coords.lon}&gsradius=${radius}&gslimit=50&format=json&origin=*`
    );
    const data = await response.json();

    if (data.query && data.query.geosearch) {
      const places: WikipediaPlace[] = [];

      for (const place of data.query.geosearch.slice(0, 30)) {
        try {
          const detailResponse = await fetch(
            `https://en.wikipedia.org/w/api.php?action=query&pageids=${place.pageid}&prop=extracts|coordinates&exintro=true&explaintext=true&format=json&origin=*`
          );
          const detailData = await detailResponse.json();
          const page = detailData.query?.pages?.[place.pageid];

          if (page && page.extract) {
            places.push({
              title: place.title,
              description: page.extract.substring(0, 200),
              coordinates: { lat: place.lat, lon: place.lon },
            });
          }
        } catch (err) {
          console.error('Error fetching place details:', err);
        }
      }

      return places;
    }
  } catch (error) {
    console.error('Error fetching nearby places:', error);
  }
  return [];
}

function categorizePlaces(
  places: WikipediaPlace[],
  interests: string[],
  trip_type: string
): ActivitySuggestion[] {
  const suggestions: ActivitySuggestion[] = [];

  const interestKeywords: { [key: string]: string[] } = {
    food: ['restaurant', 'cafe', 'market', 'food', 'cuisine', 'dining', 'bakery', 'bistro', 'eatery'],
    culture: ['museum', 'gallery', 'theater', 'theatre', 'cathedral', 'church', 'temple', 'palace', 'castle', 'historic', 'monument', 'art', 'opera', 'concert'],
    nature: ['park', 'garden', 'beach', 'mountain', 'lake', 'river', 'forest', 'nature', 'botanical', 'zoo', 'aquarium'],
    adventure: ['adventure', 'sport', 'climbing', 'hiking', 'diving', 'skiing', 'kayak', 'rafting'],
    shopping: ['market', 'shopping', 'mall', 'bazaar', 'store', 'boutique', 'shop'],
    nightlife: ['bar', 'club', 'nightlife', 'entertainment', 'pub', 'disco'],
  };

  for (const place of places) {
    const titleLower = place.title.toLowerCase();
    const descLower = place.description.toLowerCase();
    let category = 'Sightseeing';
    let matchScore = 0;

    for (const interest of interests) {
      const keywords = interestKeywords[interest] || [];
      for (const keyword of keywords) {
        if (titleLower.includes(keyword) || descLower.includes(keyword)) {
          matchScore += 1;
          if (interest === 'food') category = 'Dining';
          else if (interest === 'culture') category = 'Sightseeing';
          else if (interest === 'nature') category = 'Activity';
          else if (interest === 'shopping') category = 'Shopping';
          else if (interest === 'nightlife') category = 'Entertainment';
        }
      }
    }

    if (matchScore > 0 || interests.length === 0) {
      suggestions.push({
        title: `Visit ${place.title}`,
        category,
        notes: place.description,
        location: place.title,
        location_lat: place.coordinates?.lat,
        location_lon: place.coordinates?.lon,
      });
    }
  }

  return suggestions;
}

export async function generateActivities(
  request: GenerateActivitiesRequest
): Promise<ActivitySuggestion[]> {
  const { destination, trip_type, interests, pace, startingLocation, startingCoords } = request;

  const activitiesPerDay = {
    relaxed: 3,
    balanced: 4,
    busy: 6,
  };

  const numActivities = activitiesPerDay[pace];

  const timeSlots = {
    relaxed: ['09:00', '13:00', '18:00'],
    balanced: ['09:00', '11:30', '14:00', '18:00'],
    busy: ['08:00', '10:00', '12:00', '14:30', '17:00', '19:30'],
  };

  const slots = timeSlots[pace];

  const nearbyPlaces = await getNearbyPlaces(destination, interests, startingCoords);

  if (nearbyPlaces.length === 0) {
    return [];
  }

  const categorized = categorizePlaces(nearbyPlaces, interests, trip_type);

  if (categorized.length === 0) {
    return nearbyPlaces.slice(0, numActivities).map((place) => ({
      title: `Visit ${place.title}`,
      category: 'Sightseeing',
      notes: place.description,
      location: place.title,
      location_lat: place.coordinates?.lat,
      location_lon: place.coordinates?.lon,
    }));
  }

  const suggestions: ActivitySuggestion[] = [];
  const numToGenerate = Math.min(numActivities, categorized.length);

  for (let i = 0; i < numToGenerate; i++) {
    const activity = categorized[i];
    const startTime = slots[i] || '09:00';
    const duration = activity.category === 'Dining' ? 90 : 120;
    const endTime = addMinutes(startTime, duration);

    suggestions.push({
      ...activity,
      start_time: startTime,
      end_time: endTime,
      duration_minutes: duration,
    });
  }

  if (startingLocation && startingCoords) {
    const infoNote = ` Near ${startingLocation}.`;
    suggestions.forEach(s => {
      if (s.notes) {
        s.notes = s.notes.substring(0, 150) + infoNote;
      }
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
