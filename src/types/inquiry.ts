// CRM inquiry types — buyer inquiries, viewing requests, contact messages.
// Mirrors backend shared-types.

export type InquiryKind = 'buyer_inquiry' | 'viewing_request' | 'contact_message' | 'application';

export type InquiryStatus = 'new' | 'in_progress' | 'closed' | 'deleted';

export interface Inquiry {
  id: string;
  kind: InquiryKind;
  status: InquiryStatus;
  name: string;
  email?: string;
  phone?: string;
  message?: string;
  propertyId?: string;
  createdAt: string;
}
