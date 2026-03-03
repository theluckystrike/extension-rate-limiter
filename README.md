# extension-rate-limiter

Rate limiting utilities for Chrome extension API calls.

## Overview

extension-rate-limiter helps you implement rate limiting for API calls in your Chrome extension. Prevents hitting API quotas and ensures fair usage of external services.

## Installation

```bash
npm install extension-rate-limiter
```

## Usage

### Basic Rate Limiter

```javascript
import { RateLimiter } from 'extension-rate-limiter';

const limiter = new RateLimiter({
  maxRequests: 10,
  perMilliseconds: 1000,  // 10 requests per second
});

// Wait for rate limit before making request
await limiter.waitForToken();

fetch('https://api.example.com/data')
  .then(res => res.json())
  .then(data => console.log(data));
```

### With Multiple Buckets

```javascript
const limiter = new RateLimiter({
  buckets: {
    api: { maxRequests: 10, perMilliseconds: 1000 },
    upload: { maxRequests: 5, perMilliseconds: 60000 },
  }
});

// Different limits for different operations
await limiter.waitForToken('api');
await limiter.waitForToken('upload');
```

### Decorator Pattern

```javascript
import { rateLimit } from 'extension-rate-limiter';

const limitedFetch = rateLimit(fetch, {
  maxRequests: 5,
  perMilliseconds: 1000,
});

// Automatically rate limited
const data = await limitedFetch('https://api.example.com/data');
```

## API

### RateLimiter Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| maxRequests | number | 10 | Maximum requests allowed |
| perMilliseconds | number | 1000 | Time window in ms |
| buckets | object | null | Named rate limit buckets |

### Methods

- `waitForToken(bucket?)` - Wait until a request token is available
- `tryAcquire()` - Try to acquire token without waiting
- `reset()` - Reset the rate limiter

### rateLimit(fn, options)

Decorator to automatically rate limit a function.

## Use Cases

- **API Rate Limits**: Stay within API provider quotas
- **Server Load**: Reduce load on backend services
- **User Experience**: Prevent overwhelming external services
- **Cost Control**: Avoid unexpected API billing spikes

## Browser Support

- Chrome 90+
- Edge 90+

## License

MIT
