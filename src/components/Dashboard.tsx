import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, ArrowRight, Sparkles, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { NewTripModal } from './NewTripModal';
import { Toast } from './Toast';
import { trackEvent } from '../lib/analytics';
import { Breadcrumb } from './Breadcrumb';
import { Logo } from './Logo';

type Trip = Database['public']['Tables']['trips']['Row'];

interface DashboardProps {
  userId: string;
  onOpenTrip: (tripId: string) => void;
  onBackToLanding: () => void;
}

export function Dashboard({ userId, onOpenTrip, onBackToLanding }: DashboardProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTripModal, setShowNewTripModal] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [creatingSample, setCreatingSample] = useState(false);

  useEffect(() => {
    loadTrips();
  }, [userId]);

  const loadTrips = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('trips')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTrips(data);
    }
    setLoading(false);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDuration = (start: string, end: string) => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  const createSampleTrip = async () => {
    setCreatingSample(true);

    const { data: newTrip, error: tripError } = await supabase
      .from('trips')
      .insert({
        owner_id: userId,
        title: 'Weekend in Rome',
        primary_destination: 'Rome, Italy',
        trip_type: 'Leisure',
        start_date: '2025-06-15',
        end_date: '2025-06-17',
      })
      .select()
      .single();

    if (tripError || !newTrip) {
      setToast({ message: 'Failed to create sample trip', type: 'error' });
      setCreatingSample(false);
      return;
    }

    const days = [
      { date: '2025-06-15', index: 1 },
      { date: '2025-06-16', index: 2 },
      { date: '2025-06-17', index: 3 },
    ];

    for (const day of days) {
      const { data: newDay } = await supabase
        .from('days')
        .insert({
          trip_id: newTrip.id,
          date: day.date,
          day_index: day.index,
        })
        .select()
        .single();

      if (newDay && day.index === 1) {
        await supabase.from('activities').insert([
          {
            day_id: newDay.id,
            title: 'Visit the Colosseum',
            start_time: '09:00',
            end_time: '11:30',
            duration_minutes: 150,
            category: 'Sightseeing',
            notes: 'Book tickets in advance',
            position: 0,
          },
          {
            day_id: newDay.id,
            title: 'Lunch at Trattoria',
            start_time: '13:00',
            end_time: '14:30',
            duration_minutes: 90,
            category: 'Dining',
            notes: 'Try the carbonara',
            position: 1,
          },
        ]);
      }
    }

    await trackEvent({
      eventName: 'trip_create',
      tripId: newTrip.id,
      userId,
      metadata: { sample: true },
    });

    setToast({ message: 'Sample trip created successfully!', type: 'success' });
    setCreatingSample(false);
    loadTrips();
  };

  const deleteTrip = async (tripId: string) => {
    await trackEvent({
      eventName: 'trip_delete',
      tripId,
      userId,
    });

    await supabase.from('trips').delete().eq('id', tripId);
    setToast({ message: 'Trip deleted successfully', type: 'success' });
    loadTrips();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: 'Home', onClick: onBackToLanding },
            { label: 'My Trips' },
          ]}
        />
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Logo size="md" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600">Manage your travel itineraries</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={createSampleTrip}
              disabled={creatingSample}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50"
            >
              {creatingSample ? (
                <>
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Sample Trip
                </>
              )}
            </button>
            <button
              onClick={() => setShowNewTripModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Trip
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
          </div>
        ) : trips.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md p-12 text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No trips yet</h3>
            <p className="text-gray-600 mb-6">Create your first trip to get started</p>
            <button
              onClick={() => setShowNewTripModal(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Trip
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip) => (
              <div
                key={trip.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden group relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTrip(trip.id);
                  }}
                  className="absolute top-3 right-3 z-10 w-8 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete trip"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div
                  className="cursor-pointer"
                  onClick={() => onOpenTrip(trip.id)}
                >
                  <div className="h-32 bg-gradient-to-br from-blue-500 to-cyan-500 relative">
                    <div className="absolute inset-0 bg-black bg-opacity-10 group-hover:bg-opacity-0 transition-all duration-200"></div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                      {trip.title}
                    </h3>

                    <div className="flex items-center gap-2 text-gray-600 mb-3">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm line-clamp-1">{trip.primary_destination}</span>
                    </div>

                    <div className="flex items-center gap-2 text-gray-600 mb-4">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {trip.trip_type}
                      </span>
                      <span className="text-sm text-gray-500">
                        {getDuration(trip.start_date, trip.end_date)}
                      </span>
                    </div>

                    <button className="mt-4 w-full bg-gray-100 hover:bg-blue-600 text-gray-700 hover:text-white font-semibold py-2 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:text-white">
                      Open Trip
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showNewTripModal && (
        <NewTripModal
          userId={userId}
          onClose={() => setShowNewTripModal(false)}
          onSuccess={(tripId) => {
            setShowNewTripModal(false);
            setToast({ message: 'Trip created successfully!', type: 'success' });
            loadTrips();
            onOpenTrip(tripId);
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
