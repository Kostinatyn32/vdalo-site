# WayForPay checkout

The pricing calculator posts the selected plan, room count, billing period,
optional modules, optional one-time setup, customer name, email, and optional
phone to `/api/payments/checkout`. The server recalculates all prices and signs
the WayForPay Purchase request with `WFP_SECRET_KEY`; the secret is never sent
to the browser.

## Vercel variables

- `WFP_MERCHANT_ACCOUNT=www_vdalo_tech`
- `WFP_SECRET_KEY` — WayForPay merchant Secret Key
- `WFP_MERCHANT_DOMAIN=www.vdalo.tech`
- `VDALO_SITE_URL=https://www.vdalo.tech`

`WFP_MERCHANT_PASSWORD` is not used for checkout. It is needed for separate
WayForPay recurring-management operations such as changing or removing a
subscription; this version does not expose those operations to customers.

## Charge model

- Pay now: the first charge is the chosen prepaid subscription period plus the
  optional setup fee. Future recurring charges contain only the subscription
  and selected paid modules.
- Free 14-day trial then paid subscription: this is not a payment-scheduler
  feature. The product must create a trial account, track its expiry, suspend
  product access when the trial ends, and restore access after a confirmed
  payment. WayForPay Verify can verify a card at UAH 0 and return a `recToken`,
  but does not itself document creation of a future recurring schedule. If the
  business wants to auto-charge without a new checkout, the merchant needs a
  secure token store and scheduled server-side Charge. Do not put tokens in
  Excel. The least-complex first version is to suspend access at day 14 and
  require the customer to pay from the checkout; only then start recurring
  billing through Purchase.
- Enterprise and modules marked “from” remain quote-only in the checkout.

## Available customer flows and recommendation

1. **Subscription starts now, setup optional** — one initial Purchase includes
   the prepaid subscription period and optional setup fee; future charges are
   only the subscription and selected modules. This is the recommended default
   for customers ready to pay immediately.
2. **Free 14-day trial, then checkout and paid activation** — the VDALO product
   provides trial access and suspends it on expiry. The hotel chooses its plan
   and modules and makes its first payment to restore access; Purchase starts
   the recurring subscription. No card is needed at trial signup and there is
   no automatic charge at day 14.
3. **Free 14-day trial, automatic charge at expiry** — requires a verified
   payment token, explicit authorization for the delayed charge, durable secure
   storage, a scheduler, and a way to update/cancel the subscription. Verify
   returns a token and Charge can use it, but this application has no token
   store, subscription database, or scheduler. Keep this out of the first
   release.

**Recommendation:** enable immediate paid checkout and a separate 14-day trial
request. When the product can create and suspend accounts, trial expiry should
lead to a checkout prompt; after payment, activate access and start recurring
billing. Do not charge setup during the free trial. Automatic charge at trial
expiry can be added later only with a secure token store and scheduler.

WayForPay receives the purchase details and payment contacts. The site verifies
the signed transaction callback but does not keep an application database,
activate/suspend product accounts, or write the customer/payment ledger to
Excel. Keep the agreed first-version Excel process manual. Cancellation requests
are handled by VDALO staff using the merchant account; a customer self-service
cancellation screen is not included.

Before production use, the merchant account must have recurring payments
enabled, the public callback must be reachable at
`/api/payments/callback`, and the integration should be checked with WayForPay
test credentials before accepting live charges.
