# extension-rate-limiter — API Rate Limiting for Chrome Extensions

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> **Built by [Zovo](https://zovo.one)**

**Rate limiting** — sliding window, token bucket, request queue. Prevent API throttling in your extensions.

## 🚀 Quick Start
```typescript
import { RateLimiter, TokenBucket, RequestQueue } from 'extension-rate-limiter';
const limiter = new RateLimiter(10, 60000); // 10 req/min
await limiter.execute(() => fetch('/api/data'));
const queue = new RequestQueue(5, 10000);
const result = await queue.add(() => fetch('/api/users'));
```

## 📄 License
MIT — [Zovo](https://zovo.one)
