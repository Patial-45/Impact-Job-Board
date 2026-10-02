# Candidate module

Candidate lifecycle: account → profile → experience/education/skills/certifications/languages/preferences → resume versions → discovery/saved jobs → applications → tracking. Candidate owns profile and resumes; workspace access to candidate data needs application, consent or explicit search visibility. Resume files remain private in object storage, with signed access and retention policy.

Phase 3 implements profile CRUD and resume metadata/upload flow. Add schema only after reviewing privacy requirements, version semantics and deletion. Never store resume body in logs. Candidate route shells exist; business workflows do not. See [database](04-DATABASE-SCHEMA.md) and [security](15-SECURITY.md).
