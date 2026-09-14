import type { BloodGroup } from "./constants";

export type UserStatus = "profile_incomplete" | "pending_approval" | "active" | "rejected";
export type UserRole = "user" | "admin";
export type RequestPriority = "emergency" | "routine";
export type RequestStatus =
  | "draft"
  | "open"
  | "partially_filled"
  | "fulfilled"
  | "closed"
  | "expired";
export type InvitationResponse = "pending" | "accepted" | "rejected" | "late_accept";
export type DonationConfirmStatus = "pending" | "donated" | "not_donated";

export interface Profile {
  id: string;
  email: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  status: UserStatus;
  role: UserRole;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonorProfile {
  user_id: string;
  blood_group: BloodGroup;
  last_donation_date: string | null;
  is_available: boolean;
  willing_to_donate: boolean;
}

export interface BloodRequest {
  id: string;
  requester_id: string;
  patient_name: string;
  primary_blood_group: BloodGroup;
  units_needed: number;
  units_filled: number;
  priority: RequestPriority;
  deadline: string;
  status: RequestStatus;
  accepts_replacement: boolean;
  latitude: number;
  longitude: number;
  hospital_notes: string | null;
  facility_id: string | null;
  custom_hospital_name: string | null;
  pincode: string | null;
  location_district: string | null;
  location_state: string | null;
  closure_reason: string | null;
  closure_type: string | null;
  extension_prompted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DonorInvitation {
  id: string;
  request_id: string;
  donor_id: string;
  is_replacement_match: boolean;
  distance_km: number;
  response: InvitationResponse;
  is_confirmed: boolean;
  responded_at: string | null;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  payload: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
}

export interface ChatThread {
  id: string;
  request_id: string;
  requester_id: string;
  donor_id: string;
  status: "active" | "closed";
  created_at: string;
}

export interface ChatMessage {
  id: string;
  thread_id: string;
  sender_id: string;
  body: string;
  created_at: string;
}
