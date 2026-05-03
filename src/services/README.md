# Services Layer

## Why this exists

Today most pages call `db.*` (the Firestore REST wrapper in `src/firebase.js`)
directly from inside `useEffect` blocks. That makes the pages hard to test,
couples UI to Firestore document shapes, and means a future swap to a real
backend (Express, tRPC, Supabase) would require touching every page.

This layer centralizes Firestore access into thin domain modules so we can:

- Mock data access in unit tests (`vi.mock('../firebase')`).
- Reuse query logic across pages instead of copy-pasting `db.getDocs(...)`.
- Swap the underlying transport (Firestore -> REST API) by changing one file.
- Document and enforce consistent shapes (always `{ id, ...data }`).

## Pattern

```
components ─▶ hooks ─▶ services ─▶ firebase.js ─▶ Firestore REST
```

- **Components** never import `firebase.js` directly. They call hooks or
  services.
- **Services** are pure async functions. No React, no state, no toast/UI.
- **Services throw** on error. They do not swallow exceptions or return `null`
  to indicate failure (except for "doc not found" lookups like `getUser`).
- **Services return plain objects** (`{ id, ...data }`), never raw snapshots.

## Files

| Module            | Responsibility                                           |
| ----------------- | -------------------------------------------------------- |
| `users.js`        | `users` collection: list, get, update, search, approve   |
| `ventures.js`     | `ventures`: list, get, update + `createVenture` via API  |
| `forums.js`       | `forums`, `forums/.../posts`, `.../replies`              |
| `journey.js`      | `journeyPosts` collection                                 |
| `notifications.js`| `notifications` collection: list, unread, mark read      |
| `index.js`        | Barrel — `import { users, ventures } from '../services'` |

## Migration order (suggested)

1. **users** — smallest surface, used by Members + Admin.
2. **ventures** — already isolates the `/api/claim-queue-number` call.
3. **journey** — only 2 pages touch it.
4. **forums** — biggest, because of the sub-collection counter bumps.
5. **notifications** — last, because the polling hook needs to migrate too.

Each migration is a separate PR. Do **not** mix services migration with
unrelated UI changes.

## Rules

- No `import { db } from '../firebase'` inside `src/components/` or
  `src/pages/` once a domain is migrated. Lint rule TBD.
- Services are pure-async and stateless. No React imports allowed.
- Do not catch errors only to log them — let them bubble to the component, the
  component decides whether to show a toast or fall back.
- Counter bumps (e.g. `forum.postCount + 1`) are still caller-driven for now;
  long-term we should move them to a server-side trigger.

## Testing

Services are trivially mockable:

```js
// in a component test
vi.mock('../services/users', () => ({
  listActiveUsers: vi.fn().mockResolvedValue([{ uid: 'u1', first: 'Test' }]),
}));
```

No need to mock the entire `firebase.js` REST wrapper or `fetch`.
