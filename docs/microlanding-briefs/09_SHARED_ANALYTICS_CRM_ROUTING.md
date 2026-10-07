---
project: VDALO
market: Ukraine
artifact: microlanding_brief
version: 1.0
date: 2026-10-07
brand_rule: "VDALO = Ukraine"
punctuation_rule: "Do not use U+2014"
---


# VDALO | Shared Analytics, CRM and Routing

## 1. Purpose

Give every micro-landing the same measurement and routing language.

## 2. Canonical acquisition dimensions

Store:

- lead_id
- property_id
- source
- medium
- campaign
- offer
- landing
- message_variant
- first_touch_at
- latest_touch_at

## 3. Qualification dimensions

- property_name
- property_type
- city
- room_count
- decision_role
- current_PMS
- main_problem
- buying_timing
- trial_interest
- audit_interest
- research_interest
- switch_interest

## 4. Recommended events

### Website

- page_view
- CTA_click
- form_open
- form_start
- form_success
- form_error
- calendar_open
- messenger_click

### Funnel

- positive_reply
- decision_maker_found
- qualified_lead
- meeting_booked
- meeting_held
- audit_held
- research_interview_held
- trial_started
- trial_activated
- pms_check_held
- switch_assessment_held
- pilot_started
- pilot_completed
- commercial_sent
- paid_started
- lost
- later
- do_not_contact

## 5. Attribution

Minimum:

`first_touch_source`
`first_touch_campaign`
`last_touch_source`
`last_touch_campaign`
`entry_offer`
`converted_offer`

Example:

`entry_offer = Industry Research`
`converted_offer = PMS Health Check`

This prevents losing the real influence of earlier touchpoints.

## 6. Routing rules

### Existing PMS known

Offer candidates:

- PMS Health Check.
- Switch if explicit replacement intent.
- Audit if pain is operational, not migration.

### No PMS / spreadsheet

Offer candidates:

- Audit.
- Trial if high intent.
- One Process.

### High willingness to give feedback

Offer candidates:

- Research Partner.
- Founding Hotels.

### Low intent

Offer candidates:

- Industry Research.
- Nurture.

### Explicit "not interested"

Action:

- do_not_contact or appropriate suppression state.

## 7. Experiment dashboard

For each offer:

- delivered contacts;
- landing visits;
- positive replies;
- qualified leads;
- booked;
- held;
- activated;
- pilot;
- paid;
- cost;
- team hours.

Do not optimize primarily for open rate.

## 8. Primary comparison metric for early outbound

Recommended:

`qualified conversations per 100 delivered contacts`

Then:

`meetings held`
`trial/audit activation`
`paid conversion`

## 9. Cohort discipline

Keep untouched control inventory in the 1000-contact base.

Do not consume all contacts before learning which offer and hook works.

## 10. CRM stop rules

Stop active outreach when:

- user replies and enters human conversation;
- audit booked;
- trial active;
- explicit rejection;
- do-not-contact request.

Do not keep sending automated SMS while a salesperson is actively talking to the same person.
