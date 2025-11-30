'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import type { Profile, Address, AddressInsert, AddressUpdate } from '@/types/database';
import type { ProfileUpdateData } from '@/lib/validations/profile';

interface ProfileStore {
  // Profile state
  profile: Profile | null;
  loading: boolean;
  error: string | null;

  // Address state
  addresses: Address[];
  addressesLoading: boolean;
  addressesError: string | null;

  // Profile actions
  fetchProfile: () => Promise<void>;
  updateProfile: (data: ProfileUpdateData) => Promise<{ success: boolean; error?: string }>;
  uploadAvatar: (file: File) => Promise<{ url: string | null; error?: string }>;

  // Address actions
  fetchAddresses: () => Promise<void>;
  addAddress: (address: Omit<AddressInsert, 'user_id'>) => Promise<{ success: boolean; error?: string }>;
  updateAddress: (id: string, data: AddressUpdate) => Promise<{ success: boolean; error?: string }>;
  deleteAddress: (id: string) => Promise<{ success: boolean; error?: string }>;
  setDefaultAddress: (id: string, type: 'billing' | 'shipping') => Promise<{ success: boolean; error?: string }>;

  // Reset
  reset: () => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  // Initial state
  profile: null,
  loading: false,
  error: null,
  addresses: [],
  addressesLoading: false,
  addressesError: null,

  // Fetch profile
  fetchProfile: async () => {
    const supabase = createClient();

    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ profile: null, loading: false });
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      set({ profile, loading: false });
    } catch (error) {
      console.error('Error fetching profile:', error);
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        loading: false,
      });
    }
  },

  // Update profile
  updateProfile: async (data) => {
    const supabase = createClient();

    try {
      set({ loading: true, error: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .update(data)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ profile, loading: false });
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile';
      set({ error: errorMessage, loading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Upload avatar
  uploadAvatar: async (file) => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { url: null, error: 'Not authenticated' };
      }

      // Generate unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(filePath);

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update local state
      const currentProfile = get().profile;
      if (currentProfile) {
        set({ profile: { ...currentProfile, avatar_url: publicUrl } });
      }

      return { url: publicUrl };
    } catch (error) {
      console.error('Error uploading avatar:', error);
      return {
        url: null,
        error: error instanceof Error ? error.message : 'Failed to upload avatar',
      };
    }
  },

  // Fetch addresses
  fetchAddresses: async () => {
    const supabase = createClient();

    try {
      set({ addressesLoading: true, addressesError: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        set({ addresses: [], addressesLoading: false });
        return;
      }

      const { data: addresses, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ addresses: addresses || [], addressesLoading: false });
    } catch (error) {
      console.error('Error fetching addresses:', error);
      set({
        addressesError: error instanceof Error ? error.message : 'Failed to fetch addresses',
        addressesLoading: false,
      });
    }
  },

  // Add address
  addAddress: async (addressData) => {
    const supabase = createClient();

    try {
      set({ addressesLoading: true, addressesError: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If this is the default address, unset other defaults of same type
      if (addressData.is_default) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('type', addressData.type);
      }

      const { data: address, error } = await supabase
        .from('addresses')
        .insert({ ...addressData, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        addresses: [address, ...state.addresses],
        addressesLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error adding address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add address';
      set({ addressesError: errorMessage, addressesLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Update address
  updateAddress: async (id, data) => {
    const supabase = createClient();

    try {
      set({ addressesLoading: true, addressesError: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // If setting as default, unset other defaults of same type
      if (data.is_default && data.type) {
        await supabase
          .from('addresses')
          .update({ is_default: false })
          .eq('user_id', user.id)
          .eq('type', data.type)
          .neq('id', id);
      }

      const { data: address, error } = await supabase
        .from('addresses')
        .update(data)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        addresses: state.addresses.map((a) => (a.id === id ? address : a)),
        addressesLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error updating address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update address';
      set({ addressesError: errorMessage, addressesLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Delete address
  deleteAddress: async (id) => {
    const supabase = createClient();

    try {
      set({ addressesLoading: true, addressesError: null });

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      set((state) => ({
        addresses: state.addresses.filter((a) => a.id !== id),
        addressesLoading: false,
      }));

      return { success: true };
    } catch (error) {
      console.error('Error deleting address:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete address';
      set({ addressesError: errorMessage, addressesLoading: false });
      return { success: false, error: errorMessage };
    }
  },

  // Set default address
  setDefaultAddress: async (id, type) => {
    const supabase = createClient();

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      // Unset other defaults of same type
      await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('type', type);

      // Set this as default
      const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      set((state) => ({
        addresses: state.addresses.map((a) => ({
          ...a,
          is_default: a.id === id ? true : a.type === type ? false : a.is_default,
        })),
      }));

      return { success: true };
    } catch (error) {
      console.error('Error setting default address:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to set default address',
      };
    }
  },

  // Reset state
  reset: () => {
    set({
      profile: null,
      loading: false,
      error: null,
      addresses: [],
      addressesLoading: false,
      addressesError: null,
    });
  },
}));

// Selector hooks
export const useProfile = () => useProfileStore((state) => state.profile);
export const useAddresses = () => useProfileStore((state) => state.addresses);
export const useDefaultShippingAddress = () =>
  useProfileStore((state) =>
    state.addresses.find((a) => a.type === 'shipping' && a.is_default)
  );
export const useDefaultBillingAddress = () =>
  useProfileStore((state) =>
    state.addresses.find((a) => a.type === 'billing' && a.is_default)
  );
