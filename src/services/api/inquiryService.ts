import { apiClient } from './apiClient';
import type { Inquiry, InquiryKind } from '../../types/inquiry';

interface CreateInquiryInput {
  kind: InquiryKind;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
}

export const inquiryService = {
  async create(input: CreateInquiryInput): Promise<Inquiry> {
    const { data } = await apiClient.post<Inquiry>('/inquiries', input);
    return data;
  },

  async getMyInquiries(): Promise<Inquiry[]> {
    const { data } = await apiClient.get<Inquiry[]>('/inquiries/my');
    return data;
  },
};
