import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

interface NewTripModalProps {
  userId: string;
  onClose: () => void;
  onSuccess: (tripId: string) => void;
}

type Step = 'prompt' | 'clarify' | 'confirm';

interface ParsedTrip {
  title?: string;
  destination?: string;
  cities?: string[];
  tripType?: string;
  startDate?: string;
  endDate?: string;
  duration?: string;
}

export function NewTripModal({ userId, onClose, onSuccess }: NewTripModalProps) {
  const [step, setStep] = useState<Step>('prompt');
  const [prompt, setPrompt] = useState('');
  const [parsedTrips, setParsedTrips] = useState<ParsedTrip[]>([]);
  const [missingInfo, setMissingInfo] = useState<string[]>([]);
  const [clarifyPrompt, setClarifyPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const parsePrompt = (text: string): { trips: ParsedTrip[], missing: string[] } => {
    const trips: ParsedTrip[] = [];
    const missing: string[] = [];

    const lower = text.toLowerCase();

    const cityPatterns = [
      /(?:to|in|visit|visiting)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*(?:,\s*[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)*(?:\s+and\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)?)/g,
      /([A-Z][a-z]+(?:,\s*[A-Z][a-z]+)*(?:\s+and\s+[A-Z][a-z]+)?)/g
    ];

    let cities: string[] = [];
    for (const pattern of cityPatterns) {
      const matches = text.match(pattern);
      if (matches && matches.length > 0) {
        const citiesText = matches[0].replace(/^(to|in|visit|visiting)\s+/i, '');
        cities = citiesText.split(/,\s*|\s+and\s+/).filter(c => c.trim().length > 0);
        break;
      }
    }

    const dateMatches = text.match(/\d{4}-\d{2}-\d{2}/g) || [];
    const startDate = dateMatches[0];
    const endDate = dateMatches[1];

    const durationMatch = lower.match(/(\d+)\s*days?/);
    const duration = durationMatch ? durationMatch[1] : null;

    let tripType = 'Leisure';
    if (lower.includes('business')) tripType = 'Business';
    else if (lower.includes('adventure') || lower.includes('hiking') || lower.includes('trekking')) tripType = 'Adventure';
    else if (lower.includes('cultural') || lower.includes('museum') || lower.includes('history')) tripType = 'Cultural';
    else if (lower.includes('family') || lower.includes('kids')) tripType = 'Family';

    if (cities.length === 0) {
      missing.push('destination cities');
    }

    if (!startDate) {
      missing.push('start date (format: YYYY-MM-DD)');
    }

    if (!endDate && !duration) {
      missing.push('end date (format: YYYY-MM-DD) or trip duration');
    }

    if (cities.length > 1) {
      cities.forEach((city, index) => {
        trips.push({
          title: `${city.trim()} Trip`,
          destination: city.trim(),
          cities: [city.trim()],
          tripType,
          startDate,
          endDate,
          duration: duration || undefined
        });
      });
    } else if (cities.length === 1) {
      trips.push({
        title: `${cities[0].trim()} Trip`,
        destination: cities[0].trim(),
        cities: [cities[0].trim()],
        tripType,
        startDate,
        endDate,
        duration: duration || undefined
      });
    }

    return { trips, missing };
  };

  const handleAnalyzePrompt = () => {
    setError('');
    if (!prompt.trim()) {
      setError('Please describe your trip plans');
      return;
    }

    const { trips, missing } = parsePrompt(prompt);

    if (missing.length > 0) {
      setMissingInfo(missing);
      setStep('clarify');
    } else {
      setParsedTrips(trips);
      setStep('confirm');
    }
  };

  const handleClarify = () => {
    setError('');
    if (!clarifyPrompt.trim()) {
      setError('Please provide the missing information');
      return;
    }

    const combinedPrompt = `${prompt} ${clarifyPrompt}`;
    const { trips, missing } = parsePrompt(combinedPrompt);

    if (missing.length > 0) {
      setError(`Still missing: ${missing.join(', ')}`);
      return;
    }

    setParsedTrips(trips);
    setStep('confirm');
  };

  const handleCreateTrips = async () => {
    setLoading(true);
    setError('');

    try {
      const createdTrips = [];

      for (const trip of parsedTrips) {
        let endDate = trip.endDate;

        if (!endDate && trip.startDate && trip.duration) {
          const start = new Date(trip.startDate);
          start.setDate(start.getDate() + parseInt(trip.duration));
          endDate = start.toISOString().split('T')[0];
        }

        const { data, error: insertError } = await supabase
          .from('trips')
          .insert({
            owner_id: userId,
            title: trip.title || 'New Trip',
            primary_destination: trip.destination || 'Unknown',
            trip_type: trip.tripType || 'Leisure',
            start_date: trip.startDate || new Date().toISOString().split('T')[0],
            end_date: endDate || new Date().toISOString().split('T')[0],
          })
          .select()
          .single();

        if (insertError) throw insertError;

        if (data) {
          await trackEvent({
            eventName: 'trip_create',
            tripId: data.id,
            userId,
          });
          createdTrips.push(data.id);
        }
      }

      if (createdTrips.length > 0) {
        onSuccess(createdTrips[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create trips');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Create New Trip</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {step === 'prompt' && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Describe Your Trip
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="E.g., I want to visit Paris and Rome from 2025-12-15 to 2025-12-25 for a cultural trip\n\nOr: Planning a 7 day adventure trip to Tokyo starting 2025-11-20"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Mention cities (we'll create separate plans for multiple cities)</li>
                      <li>Include dates (YYYY-MM-DD format) or trip duration</li>
                      <li>Add keywords like adventure, cultural, family, etc.</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAnalyzePrompt}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'clarify' && (
            <>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-yellow-900 mb-2">
                  We need a bit more information:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-yellow-800">
                  {missingInfo.map((info, idx) => (
                    <li key={idx}>{info}</li>
                  ))}
                </ul>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Please provide the missing details
                </label>
                <textarea
                  value={clarifyPrompt}
                  onChange={(e) => setClarifyPrompt(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="E.g., Starting 2025-12-15 for 10 days"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleClarify}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm font-semibold text-green-900 mb-3">
                  {parsedTrips.length === 1 ? 'Trip Plan:' : `Creating ${parsedTrips.length} separate trips:`}
                </p>
                <div className="space-y-3">
                  {parsedTrips.map((trip, idx) => (
                    <div key={idx} className="bg-white rounded-lg p-3 border border-green-200">
                      <p className="font-semibold text-gray-900">{trip.title}</p>
                      <div className="text-sm text-gray-600 mt-1 space-y-1">
                        <p>Destination: {trip.destination}</p>
                        <p>Type: {trip.tripType}</p>
                        <p>Dates: {trip.startDate} to {trip.endDate || `${trip.duration} days`}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('prompt')}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Start Over
                </button>
                <button
                  type="button"
                  onClick={handleCreateTrips}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : `Create ${parsedTrips.length > 1 ? 'Trips' : 'Trip'}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
