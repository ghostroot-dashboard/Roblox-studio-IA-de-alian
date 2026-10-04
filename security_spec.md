# Security Specification: StudioForge AI

## 1. Data Invariants
- Each user can only read and write their own User document (`/users/{userId}` where `userId == request.auth.uid`).
- A Project can only be accessed or modified by its owner (`userId == request.auth.uid`).
- Conversations, Messages, GeneratedFiles, and RobloxConnections must strictly have `userId == request.auth.uid` and reference a valid projectId belonging to that user.
- Document IDs must conform to `^[a-zA-Z0-9_\-]+$` and size <= 128 chars.
- No user can escalate privileges or spoof other users' UIDs.

## 2. The Dirty Dozen Payloads
1. Spoofed User ID in /projects: `userId: "attacker_uid"` written by standard user -> Denied.
2. Cross-user reading: User A reading `/users/{userB}` -> Denied.
3. Path poisoning: Document ID with junk characters `../../bad` or 2000 chars -> Denied.
4. Shadow fields injection: `isAdmin: true` injected into User document -> Denied.
5. Project deletion by non-owner: Delete request to `/projects/{projectId}` from another user -> Denied.
6. Messages insertion with mismatched userId: `userId: "other"` in `/messages` -> Denied.
7. GeneratedFile write without authenticated session -> Denied.
8. Unbounded payload attack: 5MB string injected into message content -> Denied (capped at 50,000 chars).
9. Updating immutable project owner: `userId` changed on existing project -> Denied.
10. Unauthenticated list query on `/projects` -> Denied.
11. Reading another user's Roblox bridge pairing code: Accessing `/robloxConnections/{id}` belonging to other user -> Denied.
12. Status spoofing with invalid enum: `status: "super_admin_verified"` -> Denied.
