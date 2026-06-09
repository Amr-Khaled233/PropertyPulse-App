export interface Property {
  listing_id: string;
  property_type?: string;
  offering_type?: string;
  completion_status?: string;
  title?: string;
  price_egp?: number;
  city?: string;
  town?: string;
  district?: string;
  lat?: number;
  lon?: number;
  bedrooms?: number;
  bathrooms?: number;
  area_value?: number;
  furnished?: string;
  amenities?: string;
  is_verified?: boolean;
  is_premium?: boolean;
  payment_method?: string;
  images_count?: number;
  detail_url?: string;
  agent_name?: string;
  contact_phone?: string;
  contact_whatsapp?: string;
  // extended columns
  internal_id?: number;
  category?: string;
  listing_type?: string;
  price_period?: string;
  price_currency?: string;
  location_full?: string;
  subdistrict?: string;
  area_unit?: string;
  listing_level?: string;
  is_featured?: boolean;
  is_new_construction?: boolean;
  is_direct_from_dev?: boolean;
  is_exclusive?: boolean;
  listed_date?: string;
  has_view_360?: boolean;
  video_url?: string;
  reference?: string;
  rera?: string;
  description?: string;
  agent_id?: number;
  agent_email?: string;
  agent_is_super?: boolean;
  agent_languages?: string;
  broker_id?: number;
  broker_name?: string;
  broker_email?: string;
  broker_phone?: string;
  contact_email?: string;
  scraped_at?: string;
}

export interface SearchParams {
  search?: string;
  city?: string;
  district?: string;
  offering_type?: 'for_sale' | 'for_rent';
  property_type?: string;
  completion_status?: string;
  price_min?: number;
  price_max?: number;
  bedrooms_min?: number;
  bathrooms_min?: number;
  limit?: number;
  offset?: number;
}

export interface ListingsResponse {
  data: Property[];
  total: number;
  hasMore: boolean;
}
