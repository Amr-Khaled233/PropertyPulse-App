// Admin API — property moderation/CRUD + CRM inquiries. Admin-only endpoints.
//   GET    /admin/users
//   POST   /admin/properties        (create)
//   PUT    /admin/properties/:id     (update)
//   DELETE /admin/properties/:id     (delete)
//   GET    /admin/inquiries
//   PUT    /admin/inquiries/:id/status   { status }

import { apiClient } from './apiClient';
import type { Property } from '../../types/listing';
import type { UserProfile } from '../../types/user';
import type { Inquiry, InquiryStatus } from '../../types/inquiry';

export type PropertyDraft = Omit<Property, 'id' | 'createdAt' | 'updatedAt'>;

export const adminService = {
  async listUsers(): Promise<UserProfile[]> {
    const { data } = await apiClient.get<UserProfile[]>('/admin/users');
    return data;
  },

  async setUserPlan(id: string, plan: string): Promise<UserProfile> {
    const { data } = await apiClient.put<UserProfile>(`/admin/users/${id}/plan`, { plan });
    return data;
  },

  async createProperty(input: PropertyDraft): Promise<Property> {
    const { data } = await apiClient.post<Property>('/admin/properties', input);
    return data;
  },

  async updateProperty(id: string, patch: Partial<Property>): Promise<Property> {
    const { data } = await apiClient.put<Property>(`/admin/properties/${id}`, patch);
    return data;
  },

  async deleteProperty(id: string): Promise<void> {
    await apiClient.delete(`/admin/properties/${id}`);
  },

  async listInquiries(): Promise<Inquiry[]> {
    const { data } = await apiClient.get<Inquiry[]>('/admin/inquiries');
    return data;
  },

  async setInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    const { data } = await apiClient.put<Inquiry>(`/admin/inquiries/${id}/status`, { status });
    return data;
  },

  async deleteInquiry(id: string): Promise<void> {
    await apiClient.delete(`/admin/inquiries/${id}`);
  },
};
