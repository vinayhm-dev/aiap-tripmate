import { useState, useEffect } from 'react';
import { Plus, Calendar, MapPin, ArrowRight, Plane } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import { NewTripModal } from './NewTripModal';

type Trip = Database['public']['Tables']['trips']['Row'];

interface DashboardProps {
  userId: string;
  onOpenTrip: (tripId: string) => void;
}

export function Dashboard({ userId, onOpenTrip }: DashboardProps) {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewTripModal, setShowNewTripModal] = useState(false);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Plane className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Trips</h1>
              <p className="text-gray-600">Manage your travel itineraries</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewTripModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Trip
          </button>
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
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden cursor-pointer group"
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
            loadTrips();
            onOpenTrip(tripId);
          }}
        />
      )}
    </div>
  );
}
