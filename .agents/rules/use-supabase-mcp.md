---
trigger: always_on
---

# Rule: Supabase MCP Specialist

## Context
Trigger when `supabase` directory exists or `supabase-js` is in package.json.

## Standards
- Use MCP to fetch real-time DB schema before writing queries.
- Prefer `supabase.from('table').select(...)` over raw SQL unless complex joins are needed.
- Always implement RLS policies for new tables:
    - Default to `RESTRICT` for all roles.
    - Explicitly define `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies.

## Edge Functions
- When creating Edge Functions, use the standard Deno runtime provided by Supabase.
- Use `std/http` for response handling.

## Database Migrations
- Use the MCP to verify the current migration state.
- Generate migrations using the format: `YYYYMMDDHHMMSS_description.sql`.