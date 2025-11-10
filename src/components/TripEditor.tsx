import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, MapPin, Sparkles, Plus, ChevronDown, ChevronUp, Backpack, Share2, Printer, Check, Copy } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { ActivityModal } from './ActivityModal';
import { AISuggestionsModal } from './AISuggestionsModal';
import { PackingListModal } from './PackingListModal';

type Trip = Database['public']['Tables']['trips']['Row'];
type Day = Database['public']['Tables']['days']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];

interface TripEditorProps {
  tripId: string;
  onBack: () => void;
}

interface DayWithActivities extends Day {
  activities: Activity[];
}

export function TripEditor({ tripId, onBack }: TripEditorProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [activityModal, setActivityModal] = useState<{
    dayId: string;
    activity?: Activity;
  } | null>(null);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [showPackingList, setShowPackingList] = useState(false);
  const [shareLink, setShareLink] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  const loadTrip = async () => {
    setLoading(true);

    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', tripId)
      .single();

    if (tripData) {
      setTrip(tripData);
      await loadDays();
    }

    setLoading(false);
  };

  const loadDays = async () => {
    const { data: daysData } = await supabase
      .from('days')
      .select('*')
      .eq('trip_id', tripId)
      .order('day_index', { ascending: true });

    if (daysData) {
      const daysWithActivities = await Promise.all(
        daysData.map(async (day) => {
          const { data: activities } = await supabase
            .from('activities')
            .select('*')
            .eq('day_id', day.id)
            .order('position', { ascending: true });

          return {
            ...day,
            activities: activities || [],
          };
        })
      );

      setDays(daysWithActivities);
      setExpandedDays(new Set(daysWithActivities.map(d => d.id)));
    }
  };

  const generateDays = async () => {
    if (!trip) return;

    setGenerating(true);

    const startDate = new Date(trip.start_date);
    const endDate = new Date(trip.end_date);
    const daysList = [];

    let currentDate = new Date(startDate);
    let dayIndex = 1;

    while (currentDate <= endDate) {
      daysList.push({
        trip_id: tripId,
        date: currentDate.toISOString().split('T')[0],
        day_index: dayIndex,
        notes: '',
      });

      currentDate.setDate(currentDate.getDate() + 1);
      dayIndex++;
    }

    const { error } = await supabase.from('days').insert(daysList);

    if (!error) {
      await loadDays();
    }

    setGenerating(false);
  };

  const toggleDay = (dayId: string) => {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayId)) {
        next.delete(dayId);
      } else {
        next.add(dayId);
      }
      return next;
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (time: string | null) => {
    if (!time) return '';
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const deleteActivity = async (activityId: string) => {
    await supabase.from('activities').delete().eq('id', activityId);
    await loadDays();
  };

  const generateSlug = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let slug = '';
    for (let i = 0; i < 8; i++) {
      slug += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return slug;
  };

  const handleShare = async () => {
    const { data: existingLink } = await supabase
      .from('share_links')
      .select('slug')
      .eq('trip_id', tripId)
      .maybeSingle();

    if (existingLink) {
      const url = `${window.location.origin}/s/${existingLink.slug}`;
      setShareLink(url);
      setShowShareModal(true);
      return;
    }

    const slug = generateSlug();
    const { error } = await supabase
      .from('share_links')
      .insert({
        trip_id: tripId,
        slug,
      });

    if (!error) {
      const url = `${window.location.origin}/s/${slug}`;
      setShareLink(url);
      setShowShareModal(true);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Trip not found</p>
          <button
            onClick={onBack}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <div className="flex items-start justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">{trip.title}</h1>
            {days.length > 0 && (
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => setShowAISuggestions(true)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Sparkles className="w-5 h-5" />
                  AI Suggestions
                </button>
                <button
                  onClick={() => setShowPackingList(true)}
                  className="bg-teal-600 hover:bg-teal-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Backpack className="w-5 h-5" />
                  Packing List
                </button>
                <button
                  onClick={handleShare}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
                >
                  <Share2 className="w-5 h-5" />
                  Share
                </button>
                <button
                  onClick={handlePrint}
                  className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 print:hidden"
                >
                  <Printer className="w-5 h-5" />
                  Print
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-4 text-gray-600">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              <span>{trip.primary_destination}</span>
            </div>

            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span>
                {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
              </span>
            </div>

            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {trip.trip_type}
            </span>
          </div>
        </div>

        {days.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">Generate Your Itinerary</h3>
            <p className="text-gray-600 mb-6">
              Create day-by-day structure for your trip automatically
            </p>
            <button
              onClick={generateDays}
              disabled={generating}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {generating ? 'Generating...' : 'Generate Days'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <button
                  onClick={() => toggleDay(day.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">{day.day_index}</span>
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-semibold text-gray-900">Day {day.day_index}</h3>
                      <p className="text-sm text-gray-600">{formatDate(day.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">
                      {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                    </span>
                    {expandedDays.has(day.id) ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {expandedDays.has(day.id) && (
                  <div className="px-6 pb-6 border-t border-gray-100">
                    <div className="space-y-3 mt-4">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-gray-50 rounded-xl p-4 hover:bg-gray-100 transition-colors group"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-gray-900">{activity.title}</h4>
                                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">
                                  {activity.category}
                                </span>
                              </div>
                              {activity.start_time && (
                                <p className="text-sm text-gray-600">
                                  {formatTime(activity.start_time)}
                                  {activity.end_time && ` - ${formatTime(activity.end_time)}`}
                                  {activity.duration_minutes && ` (${activity.duration_minutes} min)`}
                                </p>
                              )}
                              {activity.notes && (
                                <p className="text-sm text-gray-500 mt-2">{activity.notes}</p>
                              )}
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => setActivityModal({ dayId: day.id, activity })}
                                className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => deleteActivity(activity.id)}
                                className="text-red-600 hover:text-red-700 font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      <button
                        onClick={() => setActivityModal({ dayId: day.id })}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 hover:border-blue-400 hover:text-blue-600 font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="w-5 h-5" />
                        Add Activity
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {activityModal && (
        <ActivityModal
          dayId={activityModal.dayId}
          activity={activityModal.activity}
          onClose={() => setActivityModal(null)}
          onSuccess={() => {
            setActivityModal(null);
            loadDays();
          }}
        />
      )}

      {showAISuggestions && trip && (
        <AISuggestionsModal
          trip={trip}
          days={days}
          onClose={() => setShowAISuggestions(false)}
          onSuccess={() => {
            setShowAISuggestions(false);
            loadDays();
          }}
        />
      )}

      {showPackingList && trip && (
        <PackingListModal
          trip={trip}
          onClose={() => setShowPackingList(false)}
        />
      )}

      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 print:hidden">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900">Share Your Trip</h3>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">
              Anyone with this link can view your trip itinerary
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={shareLink}
                readOnly
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
