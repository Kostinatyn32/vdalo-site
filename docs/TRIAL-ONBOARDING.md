# VDALO 14-day trial onboarding

## Agreed customer journey

1. On `vdalo.tech`, the hotel enters its room count, selects a base plan and
   optional modules, and chooses either a trial request or immediate payment.
2. A trial request has no payment and does not collect card details. The site
   includes the selected plan, room count, period, modules, and calculator
   estimate in the existing trial lead payload.
3. Until the PMS registration endpoint is connected, the site submits a request
   for the team to confirm and send the PMS registration link. A successful
   lead submission must never be presented as an account being created or
   access being activated.
4. The PMS starts the 14-day clock when the account is created, not when the
   marketing form is submitted. The PMS must suspend access at trial expiry.
5. The PMS presents the chosen plan and modules in its payment step (or links
   back to the calculator with those selections preserved). After WayForPay
   confirms the initial payment, the PMS activates paid access and its recurring
   period. If payment is not confirmed, access stays suspended.
6. Immediate checkout remains available from the website. A one-time setup fee
   is optional and charged with the first subscription payment; it is excluded
   from subsequent recurring charges.

## What this website now does

- Keeps immediate WayForPay checkout for subscription + selected modules, with
  optional one-time setup.
- Opens the existing trial request form from the pricing calculator and
  transfers the current plan, room count, billing period, and selected modules
  into the request. The request is delivered only if the configured trial
  webhook accepts it.
- Describes the trial as 14 days without payment or card details, and says the
  timer starts after PMS account creation.
- Does not claim to create a PMS account or activate/suspend access. The
  registration URL/API has not been provided and the PMS is not part of this
  repository.

## Required PMS integration contract

Before changing the trial CTA from a request form to direct registration, the
PMS owner must provide one of:

- a public registration URL that accepts a signed, single-use onboarding code;
  or
- an authenticated server-to-server API that creates a pending registration
  and returns a one-time registration URL.

The onboarding payload needs a stable VDALO request ID, plan ID, room count,
selected module IDs, and requested billing period. Do not put customer email,
payment data, or long-lived secrets in query parameters. The PMS registration
flow must confirm the exact terms, start its trial clock on account creation,
enforce trial expiry, and retain the selected plan/modules for later checkout.

Payment success must be verified server-to-server before the PMS changes an
account from trial/expired to paid. The current website only verifies the
WayForPay callback signature and has no durable subscription database or PMS
activation API, so it cannot yet provision or suspend product accounts.

## Go-live dependencies

- PMS registration URL/API, authentication method, and plan/module identifier
  mapping.
- PMS callback/webhook or authenticated activation endpoint for payment state.
- A durable subscription/order store shared by the payment callback and PMS;
  the agreed manual Excel ledger is not that store.
- Confirm the registration, trial-expiry, payment-success, payment-failure,
  and reactivation behavior in the PMS before making the trial self-service.
