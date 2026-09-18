export type UserRole = "grower" | "buyer" | "admin";
export type ListingStatus = "available" | "pending" | "sold" | "archived";
export type CropStatus = "dormant" | "flowering" | "veraison" | "harvested";
export type FarmingPractice = "conventional" | "sustainable" | "organic" | "biodynamic";

export interface Profile {
  id: string;
  updated_at: string;
  company_name: string;
  contact_phone: string | null;
  role: UserRole;
  region_ava: string | null;
  is_verified: boolean;
}

export interface Listing {
  id: string;
  user_id: string;
  title: string;
  variety: string;
  clone: string | null;
  rootstock: string | null;
  region_ava: string;
  sub_ava: string | null;
  estimated_tons: number;
  minimum_tons: number;
  price_per_ton: number;
  brix_target: number | null;
  description: string | null;
  status: ListingStatus;
  farming_practice: FarmingPractice;
  trellis_system: string | null;
  soil_type: string | null;
  sun_exposure: string | null;
  slope_percent: number | null;
  harvest_year: number;
  created_at: string;
  profiles?: Pick<Profile, "company_name" | "region_ava" | "is_verified">;
}

export interface CropPlan {
  id: string;
  user_id: string;
  harvest_year: number;
  variety: string;
  block_identifier: string | null;
  projected_tons: number;
  current_status: CropStatus;
  buyer_aligned_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface ListingSearchFilters {
  region_ava?: string;
  variety?: string;
  farming_practice?: string;
  trellis_system?: string;
  soil_type?: string;
  sun_exposure?: string;
  harvest_year?: string;
  slope_min?: string;
  slope_max?: string;
  min_tons?: string;
  max_price?: string;
  min_brix?: string;
}
