// Admin service — property moderation + CRM operations.

import { adminRepository } from '../repositories/admin.repository.js';
import { propertyRepository } from '../repositories/property.repository.js';
import { userRepository } from '../repositories/user.repository.js';
import { propertyService } from './property.service.js';
import type { Property, UserProfile, Inquiry, InquiryStatus, PlanTier } from '@propertypulse/shared-types';

export const adminService = {
  listUsers(): Promise<UserProfile[]> {
    return adminRepository.listUsers();
  },

  setUserPlan(id: string, plan: PlanTier): Promise<UserProfile> {
    return userRepository.setPlan(id, plan);
  },

  // --- Property management -------------------------------------------------
  createProperty(input: Omit<Property, 'id' | 'createdAt' | 'updatedAt'>): Promise<Property> {
    return propertyRepository.create(input);
  },

  async updateProperty(id: string, patch: Partial<Property>): Promise<Property> {
    await propertyService.getById(id); // 404 if missing
    return propertyRepository.update(id, patch);
  },

  async deleteProperty(id: string): Promise<void> {
    await propertyService.getById(id);
    await propertyRepository.remove(id);
  },

  // --- CRM -----------------------------------------------------------------
  listInquiries(): Promise<Inquiry[]> {
    return adminRepository.listInquiries();
  },

  setInquiryStatus(id: string, status: InquiryStatus): Promise<Inquiry> {
    return adminRepository.setInquiryStatus(id, status);
  },

  deleteInquiry(id: string): Promise<void> {
    return adminRepository.deleteInquiry(id);
  },
};
