// Public inquiry controller — lets visitors submit a contact / viewing request
// from a property page. These land in the admin CRM.

import { asyncHandler } from '../utils/asyncHandler.js';
import { created } from '../utils/apiResponse.js';
import { adminRepository } from '../repositories/admin.repository.js';

export const inquiryController = {
  create: asyncHandler(async (req, res) => {
    const inquiry = await adminRepository.createInquiry({
      kind: req.body.kind,
      name: req.body.name,
      email: req.body.email || undefined,
      phone: req.body.phone,
      message: req.body.message,
      propertyId: req.body.propertyId,
    });
    created(res, inquiry);
  }),
};
