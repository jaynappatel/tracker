// There is no login and no auth. Every table still keys rows by a user_id
// column, so all reads and writes use this one fixed, arbitrary UUID.
// It is not a secret and protects nothing — with the open RLS policies,
// anyone with the Supabase URL + anon key (both shipped in the JS bundle)
// can read and write every row regardless of this value.
export const SINGLE_USER_ID = 'b3ad2645-a6db-4868-88ce-8fb6907a2dbc';
