# Architecture

streamarr is a self-hosted web application composed of:

- Web application: creator dashboard, Overlay Studio, administration, setup and browser-source renderer.
- Worker: background event processing, alert delivery, retries and heartbeats.
- PostgreSQL: canonical relational data store.
- Redis: queues, real-time fanout coordination and transient state.
- Storage driver: local filesystem by default, S3-compatible storage optionally.

Core constraints:

- No mandatory hosted streamarr account, API, database or event relay.
- All server operations must enforce instance and workspace authorization.
- Overlay drafts are mutable; published versions are immutable.
- Synthetic simulator events must flow through the same ingestion path as platform events.
- Browser-source URLs are tokenized and should store token hashes where practical.
