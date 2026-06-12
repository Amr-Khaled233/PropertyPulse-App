// Resolves a display image for a property. Listings imported from the dataset
// have no photo URLs (images: []), so we fall back to a curated, type-matched
// stock image. Deterministic per property id → stable image with variety.

import type { Property, PropertyType } from '../types/listing';

const U = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1200&q=70`;

const POOLS: Record<PropertyType, string[]> = {
  apartment: [
    U('1502672260266-1c1ef2d93688'),
    U('1522708323590-d24dbb6b0267'),
    U('1545324418-cc1a3fa10c00'),
    U('1560448204-e02f11c3d0e2'),
  ],
  villa: [
    U('1613490493576-7fde63acd811'),
    U('1564013799919-ab600027ffc6'),
    U('1512917774080-9991f1c4c750'),
    U('1600596542815-ffad4c1539a9'),
  ],
  house: [
    U('1568605114967-8130f3a36994'),
    U('1570129477492-45c003edd2be'),
    U('1605276374104-dee2a0ed3cd6'),
    U('1583608205776-bfd35f0d9f83'),
  ],
  townhouse: [
    U('1592595896551-12b371d546d5'),
    U('1576941089067-2de3c901e126'),
    U('1448630360428-65456885c650'),
    U('1564078516393-cf04bd966897'),
  ],
  commercial: [
    U('1497366216548-37526070297c'),
    U('1497366811353-6870744d04b2'),
    U('1486406146926-c627a92ad1ab'),
    U('1554469384-e58fac16e23a'),
  ],
  land: [
    U('1500382017468-9049fed747ef'),
    U('1416879595882-3373a0480b5b'),
    U('1466692476868-aef1dfb1e735'),
    U('1492496913980-501348b61469'),
  ],
};

function hashIndex(id: string, len: number): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h % len;
}

/** Best display image for a property: its own photo, else a type-matched one. */
export function propertyImage(property: Pick<Property, 'id' | 'type' | 'images'>): string {
  if (property.images && property.images[0]) return property.images[0];
  const pool = POOLS[property.type] ?? POOLS.apartment;
  return pool[hashIndex(property.id, pool.length)];
}
