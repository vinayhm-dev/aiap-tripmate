import { useState } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { generateActivities, type ActivitySuggestion } from '../lib/aiService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { trackEvent } from '../lib/analytics';

type Trip = Database['public']['Tables']['trips']['Row'];
type Day = Database['public']['Tables']['days']['Row'];

interface AISuggestionsModalProps {
  trip: Trip;
  days: Day[];
  selectedDayId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const interests = [
  { id: 'food', label: 'Food & Dining' },
  { id: 'culture', label: 'Culture & History' },
  { id: 'nature', label: 'Nature & Outdoors' },
  { id: 'adventure', label: 'Adventure & Sports' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'nightlife', label: 'Nightlife' },
];

export function AISuggestionsModal({
  trip,
  days,
  selectedDayId,
  onClose,
  onSuccess,
}: AISuggestionsModalProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['culture', 'food']);
  const [pace, setPace] = useState<'relaxed' | 'balanced' | 'busy'>('balanced');
  const [targetDay, setTargetDay] = useState<string>(selectedDayId || 'all');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<ActivitySuggestion[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);

  const toggleInterest = (id: string) => {
    setSelectedInterests((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setLoading(true);

    const totalDays = Math.ceil(
      (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
        (1000 * 60 * 60 * 24)
    ) + 1;

    const activitiesData = await generateActivities({
      destination: trip.primary_destination,
      trip_type: trip.trip_type,
      interests: selectedInterests,
      pace,
      day_index: targetDay !== 'all' ? days.find((d) => d.id === targetDay)?.day_index : undefined,
      total_days: totalDays,
    });

    setSuggestions(activitiesData);
    setSelectedActivities(new Set(activitiesData.map((_, i) => i)));
    setShowResults(true);
    setLoading(false);

    await trackEvent({
      eventName: 'ai_generate',
      tripId: trip.id,
      userId: trip.owner_id,
      metadata: { type: 'activities', pace, interests: selectedInterests },
    });
  };

  const toggleActivity = (index: number) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const handleAddSelected = async () => {
    setLoading(true);

    const targetDays = targetDay === 'all' ? days : days.filter((d) => d.id === targetDay);

    const selectedSuggestions = suggestions.filter((_, i) => selectedActivities.has(i));

    for (let i = 0; i < targetDays.length; i++) {
      const day = targetDays[i];
      const dayActivities =
        targetDay === 'all'
          ? selectedSuggestions.slice(i * 2, i * 2 + 2)
          : selectedSuggestions;

      const { data: existingActivities } = await supabase
        .from('activities')
        .select('position')
        .eq('day_id', day.id)
        .order('position', { ascending: false })
        .limit(1);

      let nextPosition =
        existingActivities && existingActivities.length > 0
          ? (existingActivities[0].position || 0) + 1
          : 0;

      for (const activity of dayActivities) {
        await supabase.from('activities').insert({
          day_id: day.id,
          title: activity.title,
          start_time: activity.start_time || null,
          end_time: activity.end_time || null,
          duration_minutes: activity.duration_minutes || null,
          category: activity.category,
          notes: activity.notes,
          position: nextPosition++,
        });
      }
    }

    setLoading(false);
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">AI Activity Suggestions</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!showResults ? (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Destination
              </label>
              <input
                type="text"
                value={trip.primary_destination}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Interests
              </label>
              <div className="grid grid-cols-2 gap-3">
                {interests.map((interest) => (
                  <button
                    key={interest.id}
                    onClick={() => toggleInterest(interest.id)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      selectedInterests.includes(interest.id)
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {interest.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Trip Pace
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['relaxed', 'balanced', 'busy'] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPace(p)}
                    className={`px-4 py-2 rounded-lg border-2 transition-all capitalize ${
                      pace === p
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Target Day
              </label>
              <select
                value={targetDay}
                onChange={(e) => setTargetDay(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Generate for all days</option>
                {days.map((day) => (
                  <option key={day.id} value={day.id}>
                    Day {day.day_index} - {new Date(day.date).toLocaleDateString()}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || selectedInterests.length === 0}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate Activities
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Suggested Activities ({suggestions.length})
              </h3>
              <button
                onClick={() => setShowResults(false)}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Back to Options
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  onClick={() => toggleActivity(index)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedActivities.has(index)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700">
                          {suggestion.category}
                        </span>
                      </div>
                      {suggestion.start_time && (
                        <p className="text-sm text-gray-600">
                          {suggestion.start_time}
                          {suggestion.end_time && ` - ${suggestion.end_time}`}
                          {suggestion.duration_minutes && ` (${suggestion.duration_minutes} min)`}
                        </p>
                      )}
                      {suggestion.notes && (
                        <p className="text-sm text-gray-500 mt-1">{suggestion.notes}</p>
                      )}
                    </div>
                    {selectedActivities.has(index) && (
                      <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddSelected}
                disabled={loading || selectedActivities.size === 0}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Adding...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Add {selectedActivities.size} Selected
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
