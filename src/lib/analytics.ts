import { supabase } from './supabase';

export type AnalyticsEvent =
  | 'trip_create'
  | 'trip_delete'
  | 'ai_generate'
  | 'share_create'
  | 'packing_list_generate';

interface TrackEventOptions {
  eventName: AnalyticsEvent;
  tripId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export async function trackEvent({
  eventName,
  tripId,
  userId,
  metadata,
}: TrackEventOptions): Promise<void> {
  try {
    await supabase.from('logs').insert({
      event_name: eventName,
      trip_id: tripId || null,
      user_id: userId || null,
      metadata: metadata ? (metadata as any) : null,
    });
  } catch (error) {
    console.error('Failed to track event:', error);
  }
}
