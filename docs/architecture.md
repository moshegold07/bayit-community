# Bayit Community -- Architecture Design

## 1. Current State Summary

### Existing Firestore Collections
| Collection   | Documents          | Purpose                     |
|--------------|--------------------|-----------------------------|
| `users`      | `{uid}`            | User profiles               |
| `phoneIndex` | `{phone}`          | Phone uniqueness check      |
| `settings`   | `houseRules`       | App-wide settings           |

### Existing User Document Shape
```
users/{uid}:
  first: string
  last: string
  phone: string           // "+972..."
  email: string
  city: string
  categories: string[]    // up to 4
  domain: string          // categories.join(', ')
  li: string              // LinkedIn URL
  website: string
  does: string            // "what I do"
  needs: string           // "what I need"
  status: "pending" | "active"
  role: "member" | "admin"
  deleteRequest: boolean
  createdAt: string       // ISO timestamp
```

### Existing firebase.js REST Wrapper API
```
db.getDoc(collection, docId)        -> { exists(), data(), id }
db.getDocs(collection, filters?)    -> [{ id, exists(), data() }]
db.setDoc(collection, docId, data)  -> void
db.updateDoc(collection, docId, data) -> void (partial update)
db.deleteDoc(collection, docId)     -> void
```

`getDocs` supports `filters` array with `{ field, op, value }` objects joined by AND.
It does NOT currently support `orderBy` or `limit`.

---

## 2. Routing Architecture

### 2.1 Migration Strategy: useState -> react-router-dom v6

**New dependency:** `react-router-dom@6` (add to package.json)

Current routing is a chain of `if (page === '...')` in `App.jsx`. We replace it
with `<BrowserRouter>`, a layout component, and route definitions.

### 2.2 Route Table

| Path                  | Component        | Access     | Layout  |
|-----------------------|------------------|------------|---------|
| `/login`              | Login            | Public     | None    |
| `/register`           | Register         | Public     | None    |
| `/pending`            | Pending          | Auth only  | None    |
| `/`                   | Dashboard        | Active     | Navbar  |
| `/events`             | Events           | Active     | Navbar  |
| `/events/:id`         | EventDetail      | Active     | Navbar  |
| `/projects`           | Projects         | Active     | Navbar  |
| `/projects/:id`       | ProjectDetail    | Active     | Navbar  |
| `/projects/new`       | ProjectForm      | Active     | Navbar  |
| `/resources`          | Resources        | Active     | Navbar  |
| `/edit-profile`       | EditProfile      | Active     | Navbar  |
| `/admin`              | Admin            | Admin      | Navbar  |
| `*`                   | -> redirect `/`  | --         | --      |

### 2.3 Auth Guard Design

```
App.jsx
  <BrowserRouter>
    <AuthProvider>              // provides { user, loading } via context
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/pending" element={<RequireAuth><Pending /></RequireAuth>} />

        <Route element={<RequireActive><AppLayout /></RequireActive>}>
          <Route index element={<Dashboard />} />
          <Route path="events" element={<Events />} />
          <Route path="events/:id" element={<EventDetail />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/new" element={<ProjectForm />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="edit-profile" element={<EditProfile />} />
          <Route path="admin" element={<RequireAdmin><Admin /></RequireAdmin>} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  </BrowserRouter>
```

**Guard components (all thin wrappers):**

- `PublicRoute` -- if user is logged in and active, redirect to `/`. If pending, redirect to `/pending`.
- `RequireAuth` -- if not logged in, redirect to `/login`.
- `RequireActive` -- extends RequireAuth; if `status !== 'active'`, redirect to `/pending`.
- `RequireAdmin` -- extends RequireActive; if `role !== 'admin'`, redirect to `/`.

### 2.4 AuthContext Shape

```js
const AuthContext = createContext({
  user: null,      // null = not logged in; object = user doc data + uid
  loading: true,   // true while onAuthStateChanged is resolving
  refreshUser: fn, // re-fetch user doc from Firestore (call after profile edit)
});
```

The `onAuthStateChanged` listener + `db.getDoc('users', uid)` logic moves from
App.jsx into `AuthProvider`. All pages consume `useAuth()` instead of receiving
`user` as a prop.

### 2.5 AppLayout Component

```
AppLayout
  <div style={s.wrap}>
    <Navbar />            // replaces per-page <Header> blocks
    <Outlet />            // react-router renders child route here
  </div>
```

### 2.6 Page Refactoring Impact

Each existing page currently receives callback props like `onLogout`, `onAdmin`,
`onEditProfile`. After migration:

- Remove all `on*` navigation callback props from every page.
- Pages use `useNavigate()` for navigation and `useAuth()` for user data.
- `onLogout` becomes `auth.signOut()` then `navigate('/login')` inside Navbar.
- Dashboard: remove `onLogout`, `onAdmin`, `onEditProfile` props.
- Admin: remove `onLogout`, `onDashboard` props.
- EditProfile: remove `onBack`, `onSaved` props. After save, call `refreshUser()` then `navigate('/')`.
- Login: remove `onRegister`, `onSuccess` props. After login, `refreshUser()` triggers redirect.
- Register: remove `onLogin` prop.
- Pending: remove `onLogout` prop.

---

## 3. File Structure (New Files Only)

```
src/
  contexts/
    AuthContext.jsx          // AuthProvider + useAuth hook (~80 lines)

  components/
    Navbar.jsx               // Shared top bar with nav links (~120 lines)
    EventCard.jsx            // Event list item card (~80 lines)
    ProjectCard.jsx          // Project list item card (~80 lines)
    ResourceCard.jsx         // Resource list item card (~60 lines)
    BadgeDisplay.jsx         // Renders user badges (~40 lines)
    SearchBar.jsx            // Reusable search input + filters (~50 lines)
    guards/
      PublicRoute.jsx        // Redirect logged-in users (~15 lines)
      RequireAuth.jsx        // Redirect to /login (~15 lines)
      RequireActive.jsx      // Redirect pending users (~15 lines)
      RequireAdmin.jsx       // Redirect non-admins (~15 lines)
    AppLayout.jsx            // Navbar + <Outlet /> wrapper (~25 lines)

  pages/
    Events.jsx               // Event list + create form (~300 lines)
    EventDetail.jsx          // Single event view + RSVP (~200 lines)
    Projects.jsx             // Project board + create form (~300 lines)
    ProjectDetail.jsx        // Single project + comments (~250 lines)
    ProjectForm.jsx          // Create/edit project form (~200 lines)
    Resources.jsx            // Resource list + submit form (~300 lines)
```

**Total new files: 16**
**No existing files are deleted** -- they are refactored in-place.

---

## 4. Firestore Collections Schema

### 4.1 `events` Collection

```
events/{eventId}:
  title: string              // required, max 100 chars
  description: string        // required, max 2000 chars
  date: string               // ISO date "2026-05-20"
  time: string               // "18:00"
  location: string           // free text (address or "Zoom" etc.)
  type: "meetup" | "workshop" | "social" | "online"
  createdBy: string          // uid of creator
  createdByName: string      // "First Last" (denormalized for display)
  rsvps: string[]            // array of uids who RSVP'd
  rsvpCount: number          // denormalized count (avoids reading full array)
  maxAttendees: number | null // null = unlimited
  createdAt: string          // ISO timestamp
  updatedAt: string          // ISO timestamp
```

**Query patterns:**
- List upcoming events: `getDocs('events')` then client-side sort by `date` (no orderBy in wrapper). Alternatively, add orderBy support (see section 5).
- Filter by type: client-side filter (small dataset).
- My RSVPs: client-side filter on `rsvps.includes(uid)`.

**Firestore rules addition:**
```
match /events/{eventId} {
  allow read: if isActiveUser();
  allow create: if isActiveUser();
  allow update: if isActiveUser() && (
    resource.data.createdBy == request.auth.uid || isAdmin()
  );
  allow delete: if isAdmin() || resource.data.createdBy == request.auth.uid;
}
```

### 4.2 `projects` Collection

```
projects/{projectId}:
  title: string              // required, max 100 chars
  description: string        // required, max 3000 chars
  status: "looking" | "active" | "completed"
  categories: string[]       // reuse same category list as users
  lookingFor: string[]       // e.g. ["developer", "designer", "marketer"]
  createdBy: string          // uid
  createdByName: string      // denormalized
  members: string[]          // array of uids (including creator)
  memberCount: number        // denormalized
  createdAt: string
  updatedAt: string
```

**Sub-collection for comments:**
```
projects/{projectId}/comments/{commentId}:
  text: string               // max 1000 chars
  authorId: string           // uid
  authorName: string         // denormalized
  createdAt: string
```

**Why sub-collection for comments:** Comments can grow unbounded. Putting them
in the project doc would hit the 1MB doc limit and waste bandwidth on every
project read. A sub-collection allows paginated reads.

**REST wrapper note:** To query a sub-collection, use path
`projects/${projectId}/comments` with existing `getDocs`. The wrapper already
constructs the path from the collection string, so passing
`projects/${projectId}/comments` as the collection argument works as-is.

**Firestore rules addition:**
```
match /projects/{projectId} {
  allow read: if isActiveUser();
  allow create: if isActiveUser();
  allow update: if isActiveUser() && (
    resource.data.createdBy == request.auth.uid ||
    request.auth.uid in resource.data.members ||
    isAdmin()
  );
  allow delete: if isAdmin() || resource.data.createdBy == request.auth.uid;

  match /comments/{commentId} {
    allow read: if isActiveUser();
    allow create: if isActiveUser();
    allow delete: if isAdmin() ||
      get(/databases/$(database)/documents/projects/$(projectId)/comments/$(commentId)).data.authorId == request.auth.uid;
  }
}
```

### 4.3 `resources` Collection

```
resources/{resourceId}:
  title: string              // required, max 100 chars
  description: string        // max 500 chars
  url: string                // required, the actual link
  category: "article" | "tool" | "template" | "video" | "book" | "course" | "other"
  tags: string[]             // free-form tags, max 5
  sharedBy: string           // uid
  sharedByName: string       // denormalized
  upvotes: string[]          // array of uids who upvoted
  upvoteCount: number        // denormalized
  createdAt: string
```

**Firestore rules addition:**
```
match /resources/{resourceId} {
  allow read: if isActiveUser();
  allow create: if isActiveUser();
  allow update: if isActiveUser() && (
    resource.data.sharedBy == request.auth.uid || isAdmin()
  );
  allow delete: if isAdmin() || resource.data.sharedBy == request.auth.uid;
}
```

### 4.4 Badges -- Field on User Document

Badges are stored as a field on the existing `users/{uid}` document:

```
users/{uid}:
  ... existing fields ...
  badges: string[]           // e.g. ["early-adopter", "first-event", "project-creator"]
```

**Rationale:** Badges are always displayed alongside user data (member cards,
profiles). Embedding them avoids an extra Firestore read per user. The array
will stay small (under 20 items realistically), so no document size concern.

**Badge definitions** are stored client-side as a constant map:

```js
const BADGE_DEFS = {
  'early-adopter':    { label: 'חלוץ',           color: '#EF9F27' },
  'first-event':      { label: 'אירוע ראשון',    color: '#1A8080' },
  'project-creator':  { label: 'יוצר פרויקט',    color: '#7A4F9A' },
  'helpful':          { label: 'עוזר',            color: '#B05020' },
  'active-member':    { label: 'חבר פעיל',        color: '#1A6FBF' },
};
```

Badges are awarded by admin via the Admin panel (simple `updateDoc` adding
to the `badges` array). No automatic badge logic in phase 1.

---

## 5. firebase.js Enhancements

### 5.1 Add `orderBy` Support to `getDocs`

The current `getDocs` builds a `structuredQuery` but has no `orderBy`. Events
and resources need chronological sorting. Add an optional `orderBy` parameter:

```js
async getDocs(collection, filters = [], orderBy = null) {
  const body = {
    structuredQuery: {
      from: [{ collectionId: collection.split('/').pop() }],
      // ... existing filter logic ...
      orderBy: orderBy ? [{
        field: { fieldPath: orderBy.field },
        direction: orderBy.direction || 'DESCENDING'
      }] : undefined,
    }
  };
  // ... rest unchanged ...
}
```

**Important:** When `collection` is a sub-collection path like
`projects/abc123/comments`, the `collectionId` in the query must be just
`comments` (the last segment), but the REST endpoint path must be the parent
document. Adjust `firestoreRequest` path accordingly:

```js
// For sub-collections: POST to parent doc path with :runQuery
// e.g., /projects/abc123:runQuery with collectionId "comments"
```

### 5.2 Add `addDoc` (Auto-ID)

Events, projects, resources, and comments need auto-generated IDs. Add:

```js
async addDoc(collection, data) {
  const fields = {};
  for (const [k, v] of Object.entries(data)) fields[k] = toFirestoreValue(v);
  const result = await firestoreRequest(`/${collection}`, {
    method: 'POST',
    body: JSON.stringify({ fields }),
  });
  // POST to a collection creates a new doc with auto-generated ID
  // Response includes the full document name
  const id = result.name.split('/').pop();
  return id;
}
```

### 5.3 Sub-Collection Query Helper

No new method needed. The existing `getDocs` can query sub-collections by
passing the full path. However, the `:runQuery` call currently posts to the
database root. For sub-collection queries, the `from` clause with
`collectionId` is sufficient -- Firestore REST API's `runQuery` at the root
level can target any collection via the `from` field with `allDescendants: false`.

For sub-collections, call:
```js
db.getDocs(`projects/${projectId}/comments`)
```

The `structuredQuery.from` will use `collectionId: 'comments'`. However, the
runQuery endpoint must be scoped to the parent. This requires a small refactor:
when the collection path has more than one segment, post the runQuery to the
parent document path instead of the root.

### 5.4 Summary of firebase.js Changes

| Change        | Method                          | Lines |
|---------------|---------------------------------|-------|
| New           | `db.addDoc(collection, data)`   | ~12   |
| Modified      | `db.getDocs` -- add `orderBy`   | ~8    |
| Modified      | `firestoreRequest` -- sub-collection path handling | ~10 |

---

## 6. Component Hierarchy

```
BrowserRouter
  AuthProvider
    Routes
      /login -------- Login
      /register ----- Register
      /pending ------ RequireAuth > Pending

      RequireActive > AppLayout
        |
        +-- Navbar
        |     +-- nav links (Dashboard, Events, Projects, Resources)
        |     +-- user greeting
        |     +-- admin link (if admin)
        |     +-- logout button
        |
        +-- <Outlet>
              |
              /           --- Dashboard
              |                 +-- SearchBar
              |                 +-- MemberCard (existing inline)
              |                 +-- MemberModal (existing inline)
              |                 +-- BadgeDisplay
              |
              /events     --- Events
              |                 +-- SearchBar
              |                 +-- EventCard (list items)
              |                 +-- Create Event form (inline or modal)
              |
              /events/:id --- EventDetail
              |                 +-- RSVP button
              |                 +-- Attendee list
              |
              /projects   --- Projects
              |                 +-- SearchBar
              |                 +-- ProjectCard (list items)
              |
              /projects/new -- ProjectForm
              |                 +-- CategoryPicker (reuse existing)
              |
              /projects/:id -- ProjectDetail
              |                  +-- Project info
              |                  +-- Members list
              |                  +-- Comment thread (inline)
              |
              /resources  --- Resources
              |                 +-- SearchBar
              |                 +-- ResourceCard (list items)
              |                 +-- Submit Resource form (inline or modal)
              |
              /edit-profile -- EditProfile
              |                  +-- CategoryPicker (reuse existing)
              |                  +-- BadgeDisplay (read-only)
              |
              /admin      --- RequireAdmin > Admin
                                +-- existing admin UI
                                +-- badge management (new section)
```

---

## 7. Data Flow per Feature

### 7.1 Events

**List events:**
```
Events page mounts
  -> db.getDocs('events', [], { field: 'date', direction: 'ASCENDING' })
  -> setState(events)
  -> render EventCard for each
  -> client-side filter by type / search text
```

**Create event:**
```
User fills form in Events page
  -> validate fields
  -> db.addDoc('events', { ...fields, createdBy: user.uid, createdByName, rsvps: [user.uid], rsvpCount: 1 })
  -> prepend to local state
```

**RSVP:**
```
EventDetail page
  -> user clicks RSVP
  -> read current event doc
  -> if uid not in rsvps: update rsvps array + increment rsvpCount
  -> if uid already in rsvps: remove from array + decrement rsvpCount
  -> update local state
```

**Note on array manipulation:** The REST API does not support Firestore array
union/remove transforms. The client must read the current array, modify it,
and write back. This creates a small race condition window which is acceptable
for a community app with low concurrent writes.

### 7.2 Projects

**List projects:**
```
Projects page mounts
  -> db.getDocs('projects')
  -> setState(projects)
  -> client-side filter by status / categories / search
```

**Create project:**
```
User navigates to /projects/new
  -> fills ProjectForm
  -> db.addDoc('projects', { ...fields, members: [user.uid], memberCount: 1 })
  -> navigate to /projects/:newId
```

**View project + comments:**
```
ProjectDetail mounts (useParams -> id)
  -> db.getDoc('projects', id)
  -> db.getDocs(`projects/${id}/comments`, [], { field: 'createdAt', direction: 'ASCENDING' })
  -> render project info + comment list
```

**Add comment:**
```
User types comment, clicks send
  -> db.addDoc(`projects/${id}/comments`, { text, authorId, authorName, createdAt })
  -> append to local comment list
```

**Join project:**
```
User clicks "Join"
  -> read project doc
  -> if uid not in members: push uid, increment memberCount
  -> updateDoc
```

### 7.3 Resources

**List resources:**
```
Resources page mounts
  -> db.getDocs('resources')
  -> setState(resources)
  -> client-side sort by upvoteCount (most popular) or createdAt (newest)
  -> client-side filter by category / tags / search
```

**Share resource:**
```
User fills inline form (title, url, description, category, tags)
  -> db.addDoc('resources', { ...fields, upvotes: [], upvoteCount: 0 })
  -> prepend to local state
```

**Upvote:**
```
User clicks upvote on ResourceCard
  -> read current resource doc
  -> if uid in upvotes: remove + decrement
  -> if uid not in upvotes: add + increment
  -> updateDoc
  -> update local state
```

### 7.4 Badges

**Display badges (member cards, profiles):**
```
Wherever a user is rendered (Dashboard cards, MemberModal, EditProfile)
  -> if user.badges?.length > 0
  -> render <BadgeDisplay badges={user.badges} />
  -> BadgeDisplay maps each badge ID to BADGE_DEFS and renders pill/tag
```

**Award badge (admin):**
```
Admin panel > UserModal > new "Badges" section
  -> show checkboxes for each BADGE_DEFS entry
  -> on toggle: db.updateDoc('users', uid, { badges: newBadgeArray })
```

### 7.5 Navbar

**Rendering:**
```
AppLayout renders Navbar at top
  -> Navbar reads user from useAuth()
  -> Renders: logo, nav links, user greeting, admin link (if admin), logout
  -> Active link highlighted based on useLocation().pathname
```

**Navigation links:**
```
[
  { to: '/',          label: 'חברים' },
  { to: '/events',    label: 'אירועים' },
  { to: '/projects',  label: 'פרויקטים' },
  { to: '/resources', label: 'משאבים' },
]
```

### 7.6 Search (Reusable SearchBar)

```
<SearchBar
  value={search}
  onChange={setSearch}
  placeholder="חיפוש..."
  filters={[                       // optional filter dropdowns
    { key: 'type', label: 'סוג', options: [...] },
    { key: 'city', label: 'עיר', options: [...] },
  ]}
  filterValues={filterState}
  onFilterChange={setFilterState}
/>
```

All filtering is client-side. The app loads all documents for a collection on
mount, then filters in memory. This is appropriate for a community of up to a
few hundred members with low hundreds of events/projects/resources.

---

## 8. Shared Style Approach

No CSS framework is added. Continue with inline styles using the `s` object
from `shared.jsx`. New shared styles to add to `shared.jsx`:

```js
// New additions to s object:
navWrap: {
  background: BLUE,
  padding: '0.75rem 1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  flexWrap: 'wrap',
  gap: 10,
},
navLink: {
  color: 'rgba(245,240,232,0.75)',
  textDecoration: 'none',
  fontSize: 14,
  padding: '4px 10px',
  borderRadius: 6,
  transition: 'background 0.15s',
},
navLinkActive: {
  color: CREAM,
  background: 'rgba(255,255,255,0.15)',
  fontWeight: 500,
},
tag: {
  fontSize: 11,
  padding: '2px 9px',
  borderRadius: 20,
  background: BLUE_LT,
  color: BLUE_DK,
  fontWeight: 500,
},
```

---

## 9. Migration Plan (Execution Order)

Implementation should follow this order to minimize breakage:

### Phase 1: Foundation (no visible change to users)
1. Install `react-router-dom@6`
2. Create `AuthContext.jsx` with `AuthProvider` and `useAuth` hook
3. Create guard components (`PublicRoute`, `RequireAuth`, `RequireActive`, `RequireAdmin`)
4. Create `AppLayout.jsx` and `Navbar.jsx`
5. Rewrite `App.jsx` with router structure
6. Refactor each existing page to use `useAuth()` and `useNavigate()` instead of callback props

### Phase 2: firebase.js Enhancements
7. Add `addDoc` method
8. Add `orderBy` parameter to `getDocs`
9. Add sub-collection path handling

### Phase 3: New Features (can be parallelized)
10. Events page + EventDetail + EventCard
11. Projects page + ProjectDetail + ProjectForm + ProjectCard
12. Resources page + ResourceCard
13. BadgeDisplay component + badge section in Admin

### Phase 4: Polish
14. Update Firestore security rules
15. SearchBar refactor (extract from Dashboard, reuse across pages)
16. Test all routes and guard redirects

---

## 10. Firestore Security Rules (Complete Updated Version)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isAdmin() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    function isActiveUser() {
      return isSignedIn() &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.status == 'active';
    }

    // --- Existing ---

    match /users/{userId} {
      allow create: if isSignedIn() && request.auth.uid == userId;
      allow read: if isSignedIn() && (
        request.auth.uid == userId || isActiveUser() || isAdmin()
      );
      allow update: if isAdmin() ||
        (isSignedIn() && request.auth.uid == userId &&
          !request.resource.data.diff(resource.data).affectedKeys().hasAny(['status', 'role']));
      allow delete: if isAdmin();
    }

    match /phoneIndex/{phoneId} {
      allow read: if true;
      allow create: if true;
      allow delete: if isAdmin();
    }

    match /settings/{docId} {
      allow read: if true;
      allow write: if isAdmin();
    }

    // --- New ---

    match /events/{eventId} {
      allow read: if isActiveUser();
      allow create: if isActiveUser();
      allow update: if isActiveUser() && (
        resource.data.createdBy == request.auth.uid || isAdmin()
      );
      allow delete: if isAdmin() || resource.data.createdBy == request.auth.uid;
    }

    match /projects/{projectId} {
      allow read: if isActiveUser();
      allow create: if isActiveUser();
      allow update: if isActiveUser() && (
        resource.data.createdBy == request.auth.uid ||
        request.auth.uid in resource.data.members ||
        isAdmin()
      );
      allow delete: if isAdmin() || resource.data.createdBy == request.auth.uid;

      match /comments/{commentId} {
        allow read: if isActiveUser();
        allow create: if isActiveUser();
        allow update: if false;
        allow delete: if isAdmin() ||
          resource.data.authorId == request.auth.uid;
      }
    }

    match /resources/{resourceId} {
      allow read: if isActiveUser();
      allow create: if isActiveUser();
      allow update: if isActiveUser();
      allow delete: if isAdmin() || resource.data.sharedBy == request.auth.uid;
    }
  }
}
```

**Note on resources update rule:** `allow update: if isActiveUser()` is
intentionally permissive because any active user can upvote (which modifies
the `upvotes` array). A tighter rule could check that only `upvotes` and
`upvoteCount` fields are changing, but that adds complexity for marginal
security gain in a trusted community app.

---

## 11. Key Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Router library | react-router-dom v6 | De facto standard, small bundle, nested layouts |
| State management | React Context (AuthContext only) | No global store needed; each page manages its own data |
| Badges storage | Field on user doc | Always co-read with user data; small array |
| Comments storage | Sub-collection | Unbounded growth; avoids doc size limit |
| Sorting/filtering | Client-side | Dataset is small (<500 items per collection); avoids complex REST query building |
| Auto-ID generation | REST API POST to collection | Native Firestore behavior; no UUID library needed |
| CSS approach | Continue inline styles | Matches existing codebase; no migration cost |
| Search | Client-side text matching | Existing pattern in Dashboard; works for small datasets |

---

## 12. What is NOT Included (Out of Scope)

- Image/file uploads (no Firebase Storage integration)
- Real-time listeners (REST API is request-response only)
- Push notifications
- Pagination (not needed at current scale)
- i18n framework (app is Hebrew-only; strings stay inline)
- Testing strategy (separate concern from architecture)
