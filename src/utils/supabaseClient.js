import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Detect if Supabase is fully configured
export const isSupabaseConfigured = supabaseUrl !== '' && supabaseKey !== '';

export const supabase = isSupabaseConfigured ? createClient(supabaseUrl, supabaseKey) : null;

// Database helper functions (Only active when Supabase is configured)
export const db = {
  // Authentication
  async signIn(email, password) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Fetch user profile plan metadata
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', data.user.id)
      .single();

    return {
      id: data.user.id,
      email: data.user.email,
      plan: profile?.plan || 'starter'
    };
  },

  async signUp(email, password, plan) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // Create profile metadata record inside Postgres
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, email, plan });
      if (profileError) console.error("Error creating user profile record:", profileError);
    }

    return {
      id: data.user.id,
      email: data.user.email,
      plan: plan
    };
  },

  async logout() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },

  async getTours() {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('tours')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  },

  async saveTour(tour) {
    if (!isSupabaseConfigured) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user session.");

    const tourPayload = {
      id: tour.id,
      user_id: user.id,
      title: tour.title,
      description: tour.description,
      scenes: tour.scenes
    };

    const { error } = await supabase
      .from('tours')
      .upsert(tourPayload);

    if (error) throw error;
  },

  async deleteTour(tourId) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('tours')
      .delete()
      .eq('id', tourId);

    if (error) throw error;
  },

  // Upload image to Supabase Storage bucket ('renders360')
  async uploadSceneImage(file) {
    if (!isSupabaseConfigured) return null;
    
    const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
    const { data, error } = await supabase.storage
      .from('renders360')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('renders360')
      .getPublicUrl(fileName);

    return publicUrl;
  }
};
