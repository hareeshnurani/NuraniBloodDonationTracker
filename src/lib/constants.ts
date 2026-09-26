export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export const DONOR_COOLDOWN_DAYS = 90;
export const MATCH_RADIUS_KM = 50;
export const DEADLINE_WARNING_HOURS = 4;

export const USER_STATUS_LABELS: Record<string, string> = {
  profile_incomplete: "Profile Incomplete",
  pending_approval: "Pending Approval",
  active: "Active",
  rejected: "Rejected",
  suspended: "Suspended",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  open: "Open",
  partially_filled: "Partially Filled",
  fulfilled: "Fulfilled",
  closed: "Closed",
  expired: "Expired",
};

export const PRIORITY_LABELS: Record<string, string> = {
  emergency: "Emergency",
  routine: "Routine",
};
