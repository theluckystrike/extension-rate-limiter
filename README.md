# Extension Rate Limiter

[![npm version](https://img.shields.io/npm/v/extension-rate-limiter.svg)](https://www.npmjs.com/package/extension-rate-limiter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Last commit](https://img.shields.io/github/last-commit/theluckystrike/extension-rate-limiter/main)](https://github.com/theluckystrike/extension-rate-limiter/commits/main)
[![GitHub stars](https://img.shields.io/github/stars/theluckystrike/extension-rate-limiter.svg)](https://github.com/theluckystrike/extension-rate-limiter/stargazers)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/theluckystrike)](https://github.com/sponsors/theluckystrike)

API rate limiting for Chrome extensions — token bucket, sliding window, retry-after, queue, and per-domain throttling. Zero dependencies.

## Overview

`extension-rate-limiter` provides sliding window rate limiting, token bucket algorithm, and request queue management for Chrome extension developers. It prevents hitting API quotas, ensures fair usage of external services, and helps manage rate limits in Manifest V3 extensions.

### Features

- 🚀 **Sliding Window Rate Limiting** — Control request frequency with a configurable time window
- 🪣 **Token Bucket Algorithm** — Gradual token refill for smooth rate limiting
- 🌐 **Per-Origin Rate Limiting** — Separate limits for each domain/origin to respect individual API quotas
- 📋 **Request Queue** — Automatically queue and process requests within rate limits
- 🔒 **Zero Dependencies** — Lightweight, no external dependencies
- 📦 **TypeScript Ready** — Full type definitions included
- 🌐 **Browser Extension Optimized** — Designed for Chrome, Edge, and Manifest V3

## Installation

```bash
npm install extension-rate-limiter
```

Or using yarn:

```bash
yarn add extension-rate-limiter
```

Or using pnpm:

```bash
pnpm add extension-rate-limiter
```

## Usage

### RateLimiter (Sliding Window)

The `RateLimiter` class provides sliding window rate limiting — ideal for controlling how many requests can be made within a time period.

```typescript
import { RateLimiter } from 'extension-rate-limiter';

// Allow 10 requests per 60 seconds
const limiter = new RateLimiter(10, 60000);

// Check if request is allowed
if (limiter.canProceed()) {
  // Make the request
  fetch('https://api.example.com/data')
    .then(res => res.json())
    .then(data => console.log(data));
}

// Or execute automatically with waiting
const result = await limiter.execute(async () => {
  const response = await fetch('https://api.example.com/data');
  return response.json();
});

// Check remaining requests
console.log(`Remaining: ${limiter.remaining}`);

// Get wait time until next request is allowed
const waitMs = limiter.getWaitTime();
```

### TokenBucket

The `TokenBucket` class implements the token bucket algorithm — perfect for APIs that allow burst traffic but enforce an average rate.

```typescript
import { TokenBucket } from 'extension-rate-limiter';

// 10 tokens, refill 1 token per second
const bucket = new TokenBucket(10, 1);

// Try to consume a token
if (bucket.consume(1)) {
  // Token available, proceed with request
}

// Or wait for tokens to become available
await bucket.waitAndConsume(1);

// Check available tokens
console.log(`Available: ${bucket.available}`);
```

### RequestQueue

The `RequestQueue` class manages a queue of API requests with built-in rate limiting — ensures all requests are executed within rate limits.

```typescript
import { RequestQueue } from 'extension-rate-limiter';

// Queue with 10 requests per 60 seconds
const queue = new RequestQueue(10, 60000);

// Add requests to queue
const result1 = await queue.add(() => fetch('/api/data1'));
const result2 = await queue.add(() => fetch('/api/data2'));
const result3 = await queue.add(() => fetch('/api/data3'));

// Requests are automatically throttled and executed in order

// Check queue status
console.log(`Pending: ${queue.pending}`);
console.log(`Remaining: ${queue.remaining}`);
```

### Per-Origin Rate Limiting

Different APIs have different rate limits. Use per-origin limiters to manage multiple API endpoints simultaneously without one affecting another.

```typescript
import { RateLimiter } from 'extension-rate-limiter';

// Create separate limiters for different origins
const openAILimiter = new RateLimiter(50, 60000);   // 50 req/min for OpenAI
const githubLimiter = new RateLimiter(5000, 60000);  // 5000 req/min for GitHub
const customLimiter = new RateLimiter(10, 60000);    // 10 req/min for your API

// Helper function to get the right limiter by origin
function getLimiterForUrl(url: string): RateLimiter {
  const origin = new URL(url).origin;
  if (origin.includes('openai.com')) return openAILimiter;
  if (origin.includes('github.com')) return githubLimiter;
  return customLimiter;
}

// Use with any API call
async function throttledFetch(url: string) {
  const limiter = getLimiterForUrl(url);
  return limiter.execute(() => fetch(url));
}

// Multiple origins handled independently
await throttledFetch('https://api.openai.com/v1/models');
await throttledFetch('https://api.github.com/user');
```

### Distributed Rate Limiting with chrome.storage

For extensions with multiple contexts (background, popup, content scripts), synchronize rate limiting state using `chrome.storage`.

```typescript
import { RateLimiter } from 'extension-rate-limiter';

class DistributedRateLimiter {
  private limiter: RateLimiter;
  private storageKey: string;

  constructor(maxRequests: number, windowMs: number, storageKey: string) {
    this.limiter = new RateLimiter(maxRequests, windowMs);
    this.storageKey = storageKey;
  }

  // Sync state from storage
  async syncFromStorage(): Promise<void> {
    const data = await chrome.storage.local.get(this.storageKey);
    if (data[this.storageKey]) {
      // Restore timestamps from storage
      this.limiter.reset();
    }
  }

  // Persist state to storage
  async syncToStorage(): Promise<void> {
    // Store limiter state for other extension contexts
    await chrome.storage.local.set({
      [this.storageKey]: { lastSync: Date.now() }
    });
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    await this.syncFromStorage();
    const result = await this.limiter.execute(async () => {
      const value = await fn();
      await this.syncToStorage();
      return value;
    });
    return result;
  }
}

// Usage across extension contexts
const distributedLimiter = new DistributedRateLimiter(
  10,    // 10 requests
  60000, // per minute
  'rate_limit_state'
);
```

### Quota Sync with Response Headers

Handle rate limit headers from API responses (`X-RateLimit-Remaining`, `Retry-After`) to dynamically adjust limits.

```typescript
import { RateLimiter } from 'extension-rate-limiter';

interface RateLimitHeaders {
  'x-ratelimit-limit'?: string;
  'x-ratelimit-remaining'?: string;
  'x-ratelimit-reset'?: string;
  'retry-after'?: string;
}

class AdaptiveRateLimiter {
  private limiter: RateLimiter;

  constructor(maxRequests: number, windowMs: number) {
    this.limiter = new RateLimiter(maxRequests, windowMs);
  }

  async executeWithRetry<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.limiter.execute(async () => {
      const response = await fetch(url, options);
      
      // Check for rate limit headers
      const headers = response.headers as unknown as RateLimitHeaders;
      
      if (response.status === 429) {
        // Too Many Requests - respect Retry-After
        const retryAfter = parseInt(headers['retry-after'] || '60', 10);
        console.log(`Rate limited. Retrying after ${retryAfter} seconds.`);
        await new Promise(r => setTimeout(r, retryAfter * 1000));
        return this.executeWithRetry(url, options);
      }

      // Update limiter based on response headers
      if (headers['x-ratelimit-remaining']) {
        const remaining = parseInt(headers['x-ratelimit-remaining'], 10);
        if (remaining === 0) {
          console.log('Rate limit reached according to server headers');
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response.json();
    });
  }
}

// Usage
const adaptiveLimiter = new AdaptiveRateLimiter(50, 60000);
const data = await adaptiveLimiter.executeWithRetry('https://api.example.com/data');
```

## API Reference

### RateLimiter

Sliding window rate limiter for controlling request frequency.

```typescript
new RateLimiter(maxRequests: number, windowMs?: number)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxRequests` | `number` | — | Maximum number of requests allowed in the time window |
| `windowMs` | `number` | `60000` | Time window in milliseconds |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `canProceed()` | `boolean` | Returns `true` if a request can be made immediately without waiting |
| `record()` | `boolean` | Records a request timestamp. Returns `true` if successful, `false` if rate limit exceeded |
| `execute<T>(fn: () => Promise<T>)` | `Promise<T>` | Executes the function, automatically waiting if rate limit is reached |
| `getWaitTime()` | `number` | Returns milliseconds to wait until next request is allowed (0 if can proceed) |
| `reset()` | `void` | Clears all recorded timestamps, resetting the limiter |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `remaining` | `number` | Number of requests remaining in current window |

---

### TokenBucket

Token bucket algorithm for rate limiting with gradual token refill.

```typescript
new TokenBucket(maxTokens: number, refillRate?: number)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxTokens` | `number` | — | Maximum number of tokens in the bucket |
| `refillRate` | `number` | `1` | Tokens added per second |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `consume(count?: number)` | `boolean` | Tries to consume tokens. Returns `true` if successful, `false` if insufficient tokens |
| `waitAndConsume(count?: number)` | `Promise<void>` | Waits until tokens are available, then consumes them |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `available` | `number` | Number of tokens currently available (after refill) |

---

### RequestQueue

Queue for managing API requests with built-in rate limiting. Automatically processes queued requests while respecting rate limits.

```typescript
new RequestQueue(maxRequests?: number, windowMs?: number)
```

#### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `maxRequests` | `number` | `10` | Maximum requests allowed per time window |
| `windowMs` | `number` | `60000` | Time window in milliseconds |

#### Methods

| Method | Return Type | Description |
|--------|-------------|-------------|
| `add<T>(fn: () => Promise<T>)` | `Promise<T>` | Adds a request to the queue. Resolves when the request is executed |

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `pending` | `number` | Number of requests waiting in queue |
| `remaining` | `number` | Remaining requests allowed in current window |

## Use Cases

- **API Rate Limits**: Stay within API provider quotas (OpenAI, Google, etc.)
- **Server Load**: Reduce load on backend services from your extension
- **User Experience**: Prevent overwhelming external services with rapid requests
- **Cost Control**: Avoid unexpected API billing spikes from excessive requests
- **Browser Extension Compliance**: Handle Chrome's declarativeNetRequest and background script quotas

## Browser Support

- Chrome 90+
- Edge 90+
- Opera 76+
- Any Chromium-based browser
- Any browser supporting ES2020

## Project Structure

```
extension-rate-limiter/
├── src/
│   ├── index.ts        # Main entry point, exports all classes
│   ├── limiter.ts      # RateLimiter (sliding window implementation)
│   ├── bucket.ts       # TokenBucket (token bucket algorithm)
│   └── queue.ts        # RequestQueue (queue with rate limiting)
├── dist/               # Compiled JavaScript output
├── LICENSE             # MIT License
├── package.json        # NPM package configuration
├── tsconfig.json       # TypeScript configuration
└── README.md           # This file
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License — see the [LICENSE](LICENSE) file for details.

---

Built at [zovo.one](https://zovo.one) by [theluckystrike](https://github.com/theluckystrike)
