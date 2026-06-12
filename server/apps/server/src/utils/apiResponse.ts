// Helpers to build success ApiResponse envelopes (errors are handled by error.middleware).

import type { Response } from 'express';
import type { ApiResponse, Paginated } from '@propertypulse/shared-types';

export function ok<T>(res: Response, data: T, status = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(status).json(body);
}

export function created<T>(res: Response, data: T): void {
  ok(res, data, 201);
}

export function paginated<T>(res: Response, page: Paginated<T>): void {
  const body: ApiResponse<T[]> = {
    success: true,
    data: page.items,
    meta: { page: page.page, pageSize: page.pageSize, total: page.total },
  };
  res.status(200).json(body);
}
