/**
 * Request Queue — Queue API requests with rate limiting
 */
import { RateLimiter } from './limiter';

export class RequestQueue {
    private queue: Array<{ fn: () => Promise<unknown>; resolve: (v: unknown) => void; reject: (e: unknown) => void }> = [];
    private limiter: RateLimiter;
    private processing = false;

    constructor(maxRequests: number = 10, windowMs: number = 60000) {
        this.limiter = new RateLimiter(maxRequests, windowMs);
    }

    /** Add a request to the queue */
    async add<T>(fn: () => Promise<T>): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            this.queue.push({ fn, resolve: resolve as (v: unknown) => void, reject });
            this.process();
        });
    }

    get pending(): number { return this.queue.length; }
    get remaining(): number { return this.limiter.remaining; }

    private async process(): Promise<void> {
        if (this.processing) return;
        this.processing = true;
        while (this.queue.length > 0) {
            const { fn, resolve, reject } = this.queue.shift()!;
            try { const result = await this.limiter.execute(fn); resolve(result); } catch (e) { reject(e); }
        }
        this.processing = false;
    }
}
