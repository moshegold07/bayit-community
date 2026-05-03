// Centralized magic-number constants extracted from prior code review.
// Components/services should import from here instead of hard-coding values,
// so thresholds and limits can be tuned in a single place.

// Score / unlock gating
export const SCORE_UNLOCK_THRESHOLD = 10;

// Referral codes
export const REF_CODE_MIN_LENGTH = 10;
export const REF_CODE_MAX_LENGTH = 50;

// UI feedback
export const TOAST_DURATION_MS = 2000;

// Content length limits
export const POST_BODY_MAX = 5000;
export const POST_TITLE_MAX = 200;
export const JOURNEY_POST_MAX = 200;
export const ENDORSEMENT_MAX = 300;

// Auth
export const PASSWORD_MIN_LENGTH = 8;

// Polling
export const NOTIFICATION_POLL_MS = 120000; // 2 minutes
