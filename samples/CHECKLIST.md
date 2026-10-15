# PassGate — Passkey go-live CHECKLIST (30 items)

Free sample from the PassGate template pack (v0.1, pre-release, 2026-10-14).
Tick every box before you turn passkeys on for real users.
This is a working checklist, not a security audit or certification.

## A. Relying party configuration
- [ ] 1. RP ID is the registrable domain users sign in on (e.g. `acme.com`, not `login.acme.com` unless you only ever use that host)
- [ ] 2. Expected origin lists every production origin explicitly — no wildcards
- [ ] 3. Staging and preview deployments use their own RP ID / origin pair and never share credentials with production
- [ ] 4. RP name shown in the OS prompt is your product name, not a placeholder
- [ ] 5. Site is served only over HTTPS (WebAuthn requires a secure context)

## B. Registration and sign-in ceremony
- [ ] 6. Challenges are random, single-use and expire within 5 minutes
- [ ] 7. Challenge is bound to the user session that requested it
- [ ] 8. `excludeCredentials` is set so a user cannot register the same authenticator twice
- [ ] 9. `userVerification` policy is decided and documented (`preferred` or `required`)
- [ ] 10. Server verifies origin, RP ID hash, challenge and signature on every response
- [ ] 11. Failed verification returns a generic error to the client and a detailed log line on the server
- [ ] 12. Rate limiting is applied to the options and verify endpoints

## C. Credential storage
- [ ] 13. Stored per credential: ID, public key, signature counter, transports, created_at, last_used_at
- [ ] 14. Signature counter is compared on each login; a counter that goes backwards is logged
- [ ] 15. Credential table has row-level access control (only the owner can read their rows)
- [ ] 16. Deleting a user deletes their credentials (cascade)

## D. User experience
- [ ] 17. Users can list their passkeys with a device hint and last-used date
- [ ] 18. Users can rename and revoke a passkey; revoking the last one requires a fallback
- [ ] 19. Passkey autofill (conditional UI) is enabled on the username field where supported
- [ ] 20. Cancelling the OS prompt returns the user to a clear, non-error state
- [ ] 21. Copy explains what a passkey is in one sentence, without jargon

## E. Recovery and fallback
- [ ] 22. Recovery codes are generated with a CSPRNG and stored hashed
- [ ] 23. Recovery codes are shown exactly once and can be regenerated (invalidating the old set)
- [ ] 24. Users are nudged to register a second passkey on another device
- [ ] 25. Account recovery by email cannot silently add a new passkey without re-verification
- [ ] 26. Support has a written procedure for a user who lost every device

## F. Operations
- [ ] 27. Login success / failure metrics are split by method (passkey, password, recovery)
- [ ] 28. TEST_PLAN browser matrix has been run on the release candidate
- [ ] 29. Rollback plan: password login can be re-enabled without a deploy
- [ ] 30. Library versions (@simplewebauthn/*, framework) are pinned and noted in the release log
