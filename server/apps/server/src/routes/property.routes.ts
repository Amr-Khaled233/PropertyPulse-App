// Property listing routes (search, get, create).

import { Router } from 'express';
import { propertyController } from '../controllers/property.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { propertySearchSchema, createPropertySchema } from '../validators/property.validator.js';

export const propertyRouter = Router();

propertyRouter.get('/', validate(propertySearchSchema, 'query'), propertyController.search);
propertyRouter.get('/towns', propertyController.towns); // literal route — must precede '/:id'
propertyRouter.get('/:id', propertyController.getById);
propertyRouter.post('/', requireAuth, validate(createPropertySchema), propertyController.create);
