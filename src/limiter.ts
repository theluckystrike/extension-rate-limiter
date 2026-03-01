/**
 * Rate Limiter — Sliding window rate limiting
 */
export class RateLimiter {
    private timestamps: number[] = [];
    private maxRequests: number;
    private windowMs: number;

    constructor(maxRequests: number, windowMs: number = 60000) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
    }

    /** Check if a request is allowed */
    canProceed(): boolean {
        this.cleanup();
        return this.timestamps.length < this.maxRequests;
    }

    /** Record a request */
    record(): boolean {
        this.cleanup();
        if (this.timestamps.length >= this.maxRequests) return false;
        this.timestamps.push(Date.now());
        return true;
    }

    /** Execute if within limit, otherwise wait */
    async execute<T>(fn: () => Promise<T>): Promise<T> {
        while (!this.canProceed()) {
            const waitMs = this.getWaitTime();
            await new Promise((r) => setTimeout(r, waitMs));
        }
        this.record();
        return fn();
    }

    /** Remaining requests in current window */
    get remaining(): number { this.cleanup(); return Math.max(0, this.maxRequests - this.timestamps.length); }

    /** Time until next request is allowed (ms) */
    getWaitTime(): number {
        this.cleanup();
        if (this.timestamps.length < this.maxRequests) return 0;
        return this.timestamps[0] + this.windowMs - Date.now();
    }

    /** Reset */
    reset(): void { this.timestamps = []; }

    private cleanup(): void {
        const cutoff = Date.now() - this.windowMs;
        this.timestamps = this.timestamps.filter((t) => t > cutoff);
    }
}
