# Extension Rate Limiter

Rate limiting utilities for Chrome extension API calls. Zero dependencies, TypeScript-ready.

## Overview

extension-rate-limiter provides sliding window rate limiting, token bucket algorithm, and request queue management for Chrome extension developers. Prevents hitting API quotas and ensures fair usage of external services.

## Installation

```bash
npm install extension-rate-limiter
```

## Usage

### RateLimiter (Sliding Window)

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

```typescript
import { TokenBucket } from 'extension-rate-limiter';

// 10 tokens, refill 1 token per second
const bucket = new TokenBucket(10, 1);

// Try to consume a token
if (bucket.consume(1)) {
  // Token available, proceed
}

// Or wait for tokens to become available
await bucket.waitAndConsume(1);

// Check available tokens
console.log(`Available: ${bucket.available}`);
```

### RequestQueue

```typescript
import { RequestQueue } from 'extension-rate-limiter';

// Queue with 10 requests per 60 seconds
const queue = new RequestQueue(10, 60000);

// Add requests to queue
const result1 = await queue.add(() => fetch('/api/data1'));
const result2 = await queue.add(() => fetch('/api/data2'));

// Check queue status
console.log(`Pending: ${queue.pending}`);
console.log(`Remaining: ${queue.remaining}`);
```

## API Reference

### RateLimiter

Sliding window rate limiter for controlling request frequency.

```typescript
new RateLimiter(maxRequests: number, windowMs?: number)
```

**Parameters**

- maxRequests: Maximum number of requests allowed in the time window
- windowMs: Time window in milliseconds (default: 60000)

**Methods**

- canProceed(): Returns true if a request can be made immediately
- record(): Records a request and returns true if successful
- execute<T>(fn: () => Promise<T>): Executes the function, waiting if rate limit is reached
- getWaitTime(): Returns milliseconds to wait until next request is allowed
- reset(): Clears all recorded timestamps

**Properties**

- remaining: Number of requests remaining in current window

### TokenBucket

Token bucket algorithm for rate limiting with gradual refill.

```typescript
new TokenBucket(maxTokens: number, refillRate?: number)
```

**Parameters**

- maxTokens: Maximum number of tokens in the bucket
- refillRate: Tokens added per second (default: 1)

**Methods**

- consume(count?: number): Tries to consume tokens, returns true if successful
- waitAndConsume(count?: number): Waits until tokens are available, then consumes

**Properties**

- available: Number of tokens currently available

### RequestQueue

Queue for managing API requests with built-in rate limiting.

```typescript
new RequestQueue(maxRequests?: number, windowMs?: number)
```

**Parameters**

- maxRequests: Maximum requests per window (default: 10)
- windowMs: Time window in milliseconds (default: 60000)

**Methods**

- add<T>(fn: () => Promise<T>): Adds a request to the queue

**Properties**

- pending: Number of requests waiting in queue
- remaining: Remaining requests allowed in current window

## Use Cases

- API Rate Limits: Stay within API provider quotas
- Server Load: Reduce load on backend services
- User Experience: Prevent overwhelming external services
- Cost Control: Avoid unexpected API billing spikes

## Browser Support

- Chrome 90+
- Edge 90+
- Any browser supporting ES2020

## About

Maintained by theluckystrike. Part of the zovo.one ecosystem.

## License

MIT
