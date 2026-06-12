// Zod schemas for CRM inquiries.

import { z } from 'zod';

export const inquiryStatusSchema = z.object({
  status: z.enum(['new', 'in_progress', 'closed']),
});

export const createInquirySchema = z.object({
  kind: z.enum(['buyer_inquiry', 'viewing_request', 'contact_message', 'application']).default('contact_message'),
  name: z.string().min(1),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  message: z.string().optional(),
  propertyId: z.string().uuid().optional(),
});

export type InquiryStatusInput = z.infer<typeof inquiryStatusSchema>;
export type CreateInquiryInput = z.infer<typeof createInquirySchema>;
