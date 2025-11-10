import { useState, useEffect } from 'react';
import { X, Backpack, Sparkles, Check, Plus, Trash2 } from 'lucide-react';
import { generatePackingList, type PackingCategory } from '../lib/aiService';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Trip = Database['public']['Tables']['trips']['Row'];
type PackingList = Database['public']['Tables']['packing_lists']['Row'];

interface PackingListModalProps {
  trip: Trip;
  onClose: () => void;
}

export function PackingListModal({ trip, onClose }: PackingListModalProps) {
  const [packingList, setPackingList] = useState<PackingList | null>(null);
  const [content, setContent] = useState<PackingCategory>({});
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [newItem, setNewItem] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    loadPackingList();
  }, [trip.id]);

  const loadPackingList = async () => {
    setLoadingList(true);
    const { data } = await supabase
      .from('packing_lists')
      .select('*')
      .eq('trip_id', trip.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setPackingList(data);
      setContent(data.content as PackingCategory);
    }
    setLoadingList(false);
  };

  const handleGenerate = async () => {
    setLoading(true);

    const durationDays =
      Math.ceil(
        (new Date(trip.end_date).getTime() - new Date(trip.start_date).getTime()) /
          (1000 * 60 * 60 * 24)
      ) + 1;

    const generatedContent = await generatePackingList({
      destination: trip.primary_destination,
      trip_type: trip.trip_type,
      duration_days: durationDays,
      start_date: trip.start_date,
      end_date: trip.end_date,
    });

    const { data, error } = await supabase
      .from('packing_lists')
      .insert({
        trip_id: trip.id,
        content: generatedContent as any,
        generated_by: 'ai',
      })
      .select()
      .single();

    if (!error && data) {
      setPackingList(data);
      setContent(generatedContent);
    }

    setLoading(false);
  };

  const handleAddItem = (category: string) => {
    if (!newItem.trim()) return;

    const updatedContent = { ...content };
    if (!updatedContent[category]) {
      updatedContent[category] = [];
    }
    updatedContent[category] = [...updatedContent[category], newItem.trim()];
    setContent(updatedContent);
    setNewItem('');
  };

  const handleRemoveItem = (category: string, itemIndex: number) => {
    const updatedContent = { ...content };
    updatedContent[category] = updatedContent[category].filter((_, i) => i !== itemIndex);
    if (updatedContent[category].length === 0) {
      delete updatedContent[category];
    }
    setContent(updatedContent);
  };

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    const updatedContent = { ...content };
    if (!updatedContent[newCategory]) {
      updatedContent[newCategory] = [];
    }
    setContent(updatedContent);
    setNewCategory('');
  };

  const handleSave = async () => {
    if (!packingList) return;

    setLoading(true);
    await supabase
      .from('packing_lists')
      .update({ content: content as any })
      .eq('id', packingList.id);

    setLoading(false);
    setEditMode(false);
  };

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      Clothing: '👕',
      Electronics: '🔌',
      Toiletries: '🧴',
      Documents: '📄',
      'Adventure Gear': '🎒',
      'Business Items': '💼',
      Miscellaneous: '📦',
    };
    return icons[category] || '📌';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-lg flex items-center justify-center">
              <Backpack className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Packing List</h2>
              <p className="text-sm text-gray-600">{trip.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loadingList ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-teal-600 border-t-transparent"></div>
          </div>
        ) : !packingList ? (
          <div className="p-12 text-center">
            <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-10 h-10 text-teal-600" />
            </div>
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Generate Your Packing List
            </h3>
            <p className="text-gray-600 mb-6">
              Get AI-powered suggestions based on your destination and trip type
            </p>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white font-semibold px-8 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              {loading ? 'Generating...' : 'Generate Packing List'}
            </button>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                {packingList.generated_by === 'ai' && (
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI Generated
                  </span>
                )}
                <span className="text-sm text-gray-500">
                  {new Date(packingList.created_at!).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => (editMode ? handleSave() : setEditMode(true))}
                disabled={loading}
                className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
              >
                {loading ? 'Saving...' : editMode ? 'Save Changes' : 'Edit List'}
              </button>
            </div>

            <div className="space-y-6">
              {Object.entries(content).map(([category, items]) => (
                <div key={category} className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <span className="text-2xl">{getCategoryIcon(category)}</span>
                    {category}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((item, index) => (
                      <li
                        key={index}
                        className="flex items-center justify-between bg-white px-4 py-2 rounded-lg"
                      >
                        <span className="text-gray-700">{item}</span>
                        {editMode && (
                          <button
                            onClick={() => handleRemoveItem(category, index)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </li>
                    ))}
                    {editMode && (
                      <li className="flex gap-2">
                        <input
                          type="text"
                          value={newItem}
                          onChange={(e) => setNewItem(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              handleAddItem(category);
                            }
                          }}
                          placeholder="Add item..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                        />
                        <button
                          onClick={() => handleAddItem(category)}
                          className="px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              ))}

              {editMode && (
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Add New Category</h3>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddCategory();
                        }
                      }}
                      placeholder="Category name..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    />
                    <button
                      onClick={handleAddCategory}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-semibold"
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              )}
            </div>

            {Object.keys(content).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No items in packing list yet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
