import { Plane } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full text-center">
        <div className="flex justify-center mb-8">
          <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Plane className="w-10 h-10 text-white" />
          </div>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-6">
          Smart Trip
        </h1>

        <p className="text-2xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          Design world-class trips with AI-assisted itineraries
        </p>

        <button
          onClick={onGetStarted}
          className="bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold px-10 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          Start Planning
        </button>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🗓️</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Auto-Generate Days</h3>
            <p className="text-gray-600">Automatically create day-by-day itineraries based on your trip dates</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">✨</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Activities</h3>
            <p className="text-gray-600">Add, edit, and organize activities with timing and categories</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-md">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
              <span className="text-2xl">🌍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Global Packages</h3>
            <p className="text-gray-600">Perfect for 2-7 day trips to destinations worldwide</p>
          </div>
        </div>
      </div>
    </div>
  );
}
