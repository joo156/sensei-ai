# Supabase Integration

Nothing Supabase-specific is installed yet. These steps replace the mock auth/data with Supabase without touching UI components.

## 1. Enable and configure

Enable a Supabase project (or add `@supabase/supabase-js`), then set:

```
VITE_SUPABASE_URL=...
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_ENABLE_MOCK=false
```

## 2. Replace auth

Edit `src/api/auth.api.ts` only:

- `login()` → `supabase.auth.signInWithPassword({ email, password })`, map to `Session`.
- `logout()` → `supabase.auth.signOut()`.
- `getCurrentUser()` → `supabase.auth.getUser()` + `profiles` + `user_roles` lookup.
- `refreshSession()` → `supabase.auth.refreshSession()`.

Then in `src/services/AuthService.ts` replace `restoreSession()`/`persist()` with `supabase.auth.getSession()` and let the Supabase client own storage. `AuthContext` keeps its API (`login`, `logout`, `refreshSession`, `getCurrentUser`, `hasRole`, `can`), so no page changes.

Signup: add `signUp()` to `auth.api.ts` → `supabase.auth.signUp`, and insert a `profiles` row via trigger.

## 3. Roles

Store roles in `user_roles` (never on `profiles`) with an `app_role` enum and a `has_role(uuid, app_role)` security-definer function. `getCurrentUser()` maps the row into `AuthUser.role`; `ROLE_PERMISSIONS` continues to drive UI permissions.

## 4. Workspace ownership

`workspaces.owner_id = auth.uid()`. `workspace.api.ts` becomes `supabase.from("workspaces").select()/insert()`. Every child table carries `workspace_id`.

## 5. Row Level Security

Enable RLS on all tables and grant Data API access in the same migration:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON public.workspaces TO authenticated;
GRANT ALL ON public.workspaces TO service_role;
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own workspaces" ON public.workspaces
  FOR ALL TO authenticated USING (owner_id = auth.uid());
```

Reviewer/admin read policies use `public.has_role(auth.uid(), 'reviewer')`. Students read their own generations plus review status and reviewer comments.

## 6. Storage

Create a private `documents` bucket. `UploadService.upload()` → `supabase.storage.from("documents").upload(`${workspaceId}/${docId}/${file.name}`, file)`; store `storage_path` on the `documents` row and read files back with signed URLs.

## 7. Realtime

Subscribe where the mock layer currently polls nothing:

```ts
supabase.channel("reviews")
  .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, handler)
  .subscribe();
```

Wire this inside `ReviewService`/`WorkspaceContext` so components just re-render.

## 8. Checklist

- [ ] env vars set, `VITE_ENABLE_MOCK=false`
- [ ] `auth.api.ts` + `AuthService` swapped
- [ ] `user_roles` + `has_role()` in place
- [ ] RLS + GRANTs on every table
- [ ] storage bucket + signed URLs
- [ ] realtime channels for reviews/notifications
