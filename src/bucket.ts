/**
 * Token Bucket — Token-based rate limiting
 */
export class TokenBucket {
    private tokens: number;
    private maxTokens: number;
    private refillRate: number;
    private lastRefill: number;

    constructor(maxTokens: number, refillRate: number = 1) {
        this.tokens = maxTokens;
        this.maxTokens = maxTokens;
        this.refillRate = refillRate; // tokens per second
        this.lastRefill = Date.now();
    }

    /** Try to consume a token */
    consume(count: number = 1): boolean {
        this.refill();
        if (this.tokens >= count) { this.tokens -= count; return true; }
        return false;
    }

    /** Wait for tokens then consume */
    async waitAndConsume(count: number = 1): Promise<void> {
        while (!this.consume(count)) {
            const needed = count - this.tokens;
            const waitMs = (needed / this.refillRate) * 1000;
            await new Promise((r) => setTimeout(r, waitMs));
        }
    }

    get available(): number { this.refill(); return Math.floor(this.tokens); }

    private refill(): void {
        const now = Date.now();
        const elapsed = (now - this.lastRefill) / 1000;
        this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
        this.lastRefill = now;
    }
}
