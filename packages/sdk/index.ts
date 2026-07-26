export type PocketConfig = {
    apiKey: string;
    baseUrl?: string;
};

export class Pocket {
    private apiKey: string;
    private baseUrl: string;

    constructor(config: PocketConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl ?? "https://api.pocketstrip.dev";
    }

    private async request(path: string, options: RequestInit = {}) {
        const res = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${this.apiKey}`,
                ...options.headers,
            },
        });

        if (!res.ok) {
            const body = await res
                .json()
                .catch(() => ({ error: res.statusText }));
            throw new Error(body.error ?? "PocketStrip request failed");
        }

        return res.json();
    }

    customers = {
        create: (input: { email: string; name?: string }) =>
            this.request("/v1/customers", {
                method: "POST",
                body: JSON.stringify(input),
            }),
    };

    checkout(input: { customerId: string; planId: string }) {
        return this.request("/v1/checkout", {
            method: "POST",
            body: JSON.stringify(input),
        });
    }
}
