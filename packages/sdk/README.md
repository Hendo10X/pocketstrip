# @pocketstrip/sdk

The client for the PocketStrip API. Create an API key in the dashboard under
**Developers**, then:

```ts
import { Pocket } from "@pocketstrip/sdk";

const pocket = new Pocket({
    apiKey: process.env.POCKETSTRIP_API_KEY!,
    baseUrl: "http://localhost:4000", // your PocketStrip API
});

// 1. Create a customer
const { customer } = await pocket.customers.create({ email: "ada@example.com" });

// 2. Send them to checkout for a plan (copy the plan ID from the Plans page)
const { checkoutUrl } = await pocket.checkout({
    customerId: customer.id,
    planId: "PLAN_ID",
});

// 3. Gate features in your app
const { hasAccess, limit } = await pocket.access(customer.id, "reports");

// Or fetch everything they're entitled to
const { features } = await pocket.entitlements(customer.id);
```

`access()` returns a `reason` you can branch on: `active_subscription`,
`on_trial`, `no_active_subscription`, or `feature_not_in_plan`.
