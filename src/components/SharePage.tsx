import { useState, useEffect } from 'react';
import { Calendar, MapPin, Plane } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { Breadcrumb } from './Breadcrumb';
import { Logo } from './Logo';

type Trip = Database['public']['Tables']['trips']['Row'];
type Day = Database['public']['Tables']['days']['Row'];
type Activity = Database['public']['Tables']['activities']['Row'];

interface SharePageProps {
  slug: string;
}

interface DayWithActivities extends Day {
  activities: Activity[];
}

export function SharePage({ slug }: SharePageProps) {
  const [trip, setTrip] = useState<Trip | null>(null);
  const [days, setDays] = useState<DayWithActivities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    loadSharedTrip();
  }, [slug]);

  const loadSharedTrip = async () => {
    setLoading(true);

    const { data: shareLink } = await supabase
      .from('share_links')
      .select('trip_id, expires_at')
      .eq('slug', slug)
      .maybeSingle();

    if (!shareLink) {
      setError(true);
      setLoading(false);
      return;
    }

    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      setError(true);
      setLoading(false);
      return;
    }

    const { data: tripData } = await supabase
      .from('trips')
      .select('*')
      .eq('id', shareLink.trip_id)
      .single();

    if (tripData) {
      setTrip(tripData);

      const { data: daysData } = await supabase
        .from('days')
        .select('*')
        .eq('trip_id', shareLink.trip_id)
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
      }
    }

    setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">😕</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Trip Not Found</h2>
          <p className="text-gray-600">
            This trip link may have expired or doesn't exist.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <Logo size="md" />
        </div>

        <Breadcrumb
          items={[
            { label: 'Shared Trip' },
            { label: trip?.title || 'Loading...' },
          ]}
        />

        <div className="bg-white rounded-2xl shadow-lg p-8 mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{trip.title}</h1>

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
            <p className="text-gray-600">No itinerary details available yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {days.map((day) => (
              <div key={day.id} className="bg-white rounded-2xl shadow-md overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-cyan-500">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center">
                      <span className="text-lg font-bold text-blue-600">{day.day_index}</span>
                    </div>
                    <div className="text-white">
                      <h3 className="text-lg font-semibold">Day {day.day_index}</h3>
                      <p className="text-sm text-blue-50">{formatDate(day.date)}</p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {day.activities.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No activities planned</p>
                  ) : (
                    <div className="space-y-3">
                      {day.activities.map((activity) => (
                        <div
                          key={activity.id}
                          className="bg-gray-50 rounded-xl p-4"
                        >
                          <div className="flex items-start gap-3">
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Created with Smart Trip</p>
        </div>
      </div>
    </div>
  );
}
