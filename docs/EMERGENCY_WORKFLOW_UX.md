# Emergency Workflow UX (Patient-Facing)

## Mobile App UX (Primary)

### 1. Persistent Emergency Button

- Always visible (bottom nav / floating button).
- Red color + “Emergency / Call 911”.

### 2. Tap → Confirmation Screen

Message: “This will call 911 for immediate help.”

Options:
- ✅ Call 911 now
- ❌ Cancel

Optional display:
- Patient name
- Location (if permitted)
- Emergency contacts

### 3. Action

- Uses device-native emergency calling.
- No AI voice interception.
- Call handled entirely by telecom system.

### 4. After Call (Post-Event)

- App asks: “Are you safe now?”
- Option to notify:
  - Doctor
  - Emergency contact
- Event logged in care timeline.

## Web App UX (Secondary / Desktop)

### 1. Emergency Button

- Prominent banner/button: “Emergency Help”.

### 2. Click → Emergency Panel

Shows:
- “Call 911 from your phone now”

One-click:
- Notify doctor
- Notify emergency contact

Optional:
- Share location
- Share last visit summary

### 3. Safety Notice

Clear disclaimer:
- “For immediate emergencies, call 911 using your phone.”

## AI’s Role (Strictly Assistive)

- Detects high-risk signals (symptoms, vitals, keywords).
- Shows alert: “This may be an emergency. Consider calling 911.”
- ❌ Never auto-calls emergency services.
- ✅ Always requires patient confirmation.

## Mobile + Web Architecture (High Level)

### Frontend

- Mobile: React Native / Flutter / Native iOS & Android
- Web: React / Next.js
- Shared design system + RBAC (patient vs doctor)

### Backend Services

- Emergency Event Service
  - Timestamp
  - Trigger source (manual / AI suggestion)
  - Notifications sent
  - No call audio stored
- Notification Service
  - Doctor alerts (secure push / email)
  - Emergency contact notifications
- Consent & Audit Service
  - Confirms emergency consent
  - Immutable audit logs (HIPAA-safe)

### Integrations

- Mobile OS Emergency APIs (iOS / Android)
- Location Services (opt-in only)
- EHR / Care Timeline
- Insurance / Claims (post-event documentation only)

## Compliance & Safety Controls

- Manual patient action required.
- Clear disclaimers at every step.
- No AI diagnosis or emergency decisions.
- End-to-end encryption.
- Role-based visibility.
- Full audit trail.

## Emergency Workflow Summary (Simple)

1. Patient taps Emergency.
2. Confirms action.
3. Calls 911 via phone.
4. System logs event.
5. Doctor + contacts notified.
6. Event added to care history.
