// Admin repository — user listing + CRM inquiries access (service-role).

import { supabase } from '../config/supabase.js';
import { ApiError } from '../utils/apiError.js';
import { toUserProfile, type ProfileRow } from '../models/user.model.js';
import type { UserProfile, Inquiry, InquiryStatus } from '@propertypulse/shared-types';

interface InquiryRow {
  id: string;
  kind: Inquiry['kind'];
  status: InquiryStatus;
  name: string;
  email: string | null;
  phone: string | null;
  message: string | null;
  property_id: string | null;
  created_at: string;
}

function toInquiry(row: InquiryRow): Inquiry {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    message: row.message ?? undefined,
    propertyId: row.property_id ?? undefined,
    createdAt: row.created_at,
  };
}

export const adminRepository = {
  async listUsers(): Promise<UserProfile[]> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'USERS_FETCH_FAILED', error.message);
    return (data as ProfileRow[]).map(toUserProfile);
  },

  async listInquiries(): Promise<Inquiry[]> {
    const { data, error } = await supabase
      .from('inquiries')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw new ApiError(500, 'INQUIRIES_FETCH_FAILED', error.message);
    return (data as InquiryRow[]).map(toInquiry);
  },

  async createInquiry(input: {
    kind: Inquiry['kind'];
    name: string;
    email?: string;
    phone?: string;
    message?: string;
    propertyId?: string;
  }): Promise<Inquiry> {
    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        kind: input.kind,
        name: input.name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        message: input.message ?? null,
        property_id: input.propertyId ?? null,
      })
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'INQUIRY_CREATE_FAILED', error.message);
    return toInquiry(data as InquiryRow);
  },

  async setInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    const { data, error } = await supabase
      .from('inquiries')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new ApiError(500, 'INQUIRY_UPDATE_FAILED', error.message);
    return toInquiry(data as InquiryRow);
  },
};
