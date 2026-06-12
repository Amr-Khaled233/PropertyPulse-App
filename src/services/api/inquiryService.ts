// Public inquiry submission (contact / viewing request from a property page).
//   POST /inquiries { kind, name, email?, phone?, message?, propertyId? }

import { apiClient } from './apiClient';
import type { Inquiry, InquiryKind } from '../../types/inquiry';

export interface InquiryDraft {
  kind: InquiryKind;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
}

export const inquiryService = {
  async create(draft: InquiryDraft): Promise<Inquiry> {
    const { data } = await apiClient.post<Inquiry>('/inquiries', draft);
    return data;
  },
};
