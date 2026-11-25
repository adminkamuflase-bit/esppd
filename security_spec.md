# Security Specification — SPPD MTsN 6 Ciamis

## 1. Data Invariants
1. **Default-Deny Baseline**: Every unspecified path in Firestore is denied (`allow read, write: if false;`).
2. **Verified Identity**: Only authenticated users with verified email (`request.auth != null && request.auth.token.email_verified == true`) can read or mutate their own workspace resources.
3. **Master Gate Relational Sync**: Every document under `/workspaces/{workspaceId}/settings`, `/pegawai`, and `/sppd` requires the parent `/workspaces/{workspaceId}` document to exist and have `ownerId == request.auth.uid` (or verified admin).
4. **Path ID & Payload Consistency**: Document IDs (`userId`, `workspaceId`, `settingId`, `pegawaiId`, `sppdId`) must match `^[a-zA-Z0-9_\-]+$` (length `<= 128`), and `ownerId` / `id` inside payloads must match path parameters and `request.auth.uid`.
5. **Privilege Escalation Prevention**: Users cannot assign themselves an `admin` role in `/users/{userId}` (`role == 'operator'`) and cannot write to `/admins/{adminId}`.
6. **Immutable Audit Fields & Server Timestamps**: `ownerId`, `id`, `uid`, and `createdAt` are immutable after creation; `createdAt == request.time` on create and `updatedAt == request.time` on update.
7. **Terminal State Locking**: Once an SPPD document reaches `status == 'Selesai'`, non-admin users cannot update the record.
8. **Strict Key & Size Allowlists**: All creations enforce `hasAll` + `hasOnly`; all updates enforce `affectedKeys().hasOnly(...)` inside named action branches wrapped by `isValid[Entity](incoming())`; strings enforce `.size()` bounds and arrays (`pengikut`) enforce `.size() <= 20`.

## 2. The "Dirty Dozen" Payloads (Expected: `PERMISSION_DENIED`)
1. **Shadow Field Injection on User Create**: `{ uid, email, displayName, role: 'operator', isAdmin: true, createdAt, updatedAt }` -> rejected by `hasOnly`.
2. **Self-Assigned Admin Role**: `{ uid, email, displayName, role: 'admin', createdAt, updatedAt }` -> rejected by `role == 'operator'`.
3. **Cross-Tenant Identity Spoofing on SPPD Create**: `{ ..., ownerId: 'other-user-uid' }` inside `/workspaces/{myUid}/sppd/sppd-1` -> rejected by `ownerId == request.auth.uid`.
4. **ID Poisoning (Oversized Path ID)**: Creating `/workspaces/{uid}/sppd/` with 1,500-char ID -> rejected by `isValidId(sppdId)`.
5. **Client-Forged Timestamp on Create**: `{ ..., createdAt: '2020-01-01T00:00:00Z' }` -> rejected by `createdAt == request.time`.
6. **Modifying Immutable `createdAt` on Update**: Updating SPPD with altered `createdAt` -> rejected by `affectedKeys().hasOnly(...)` and `incoming().createdAt == existing().createdAt`.
7. **Unverified Email Write**: Authenticated token with `email_verified: false` (even matching admin email) -> rejected by `request.auth.token.email_verified == true`.
8. **Orphaned Subcollection Write**: Creating `/workspaces/{uid}/pegawai/peg-1` when `/workspaces/{uid}` does not exist -> rejected by Master Gate `exists(...)`.
9. **Terminal State Mutation**: Non-admin attempting to edit an SPPD whose `existing().status == 'Selesai'` -> rejected by `existing().status != 'Selesai' || isAdmin()`.
10. **Array Flood on `pengikut`**: Creating SPPD with `pengikut` array containing 25 items -> rejected by `data.pengikut.size() <= 20`.
11. **Value Poisoning on Status Update**: Updating `status` to `'Disetujui'` alongside an injected `'pegawaiNip': 'hacked'` using status branch -> rejected by `affectedKeys().hasOnly(['status', 'updatedAt'])`.
12. **Blanket List Query Scraping**: Querying `/workspaces/{otherUid}/sppd` without `where('ownerId', '==', request.auth.uid)` -> rejected by `resource.data.ownerId == request.auth.uid || isAdminEmail()`.
