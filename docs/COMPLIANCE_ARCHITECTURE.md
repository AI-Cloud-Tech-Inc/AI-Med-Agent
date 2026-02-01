# HIPAA / Compliance-Ready Architecture (Mapped)

## 1. Data Security & Privacy

- End-to-end encryption: TLS 1.2+ in transit, AES-256 at rest.
- PHI isolated per tenant (doctor/clinic level).
- No raw audio stored unless explicitly approved.
- Automatic data minimization and retention policies.

## 2. Access Control

- Role-Based Access Control (RBAC):
  - Doctor: full clinical access + approvals.
  - Patient: read-only (labs, meds, appointments, insurance).
  - Admin: system configuration only.
- Multi-Factor Authentication (MFA).
- Least-privilege IAM policies.

## 3. Auditability & Explainability

- Immutable audit logs (who accessed what, when, why).
- AI decision trace logs (inputs → reasoning → outputs).
- Human-in-the-loop enforcement (AI suggestions ≠ decisions).
- Emergency actions logged (no call content stored).

## 4. Compliance Controls

- HIPAA, SOC 2, HITRUST alignment.
- Consent capture for voice listening.
- Automatic redaction of sensitive identifiers.
- Secure EHR integrations (FHIR / HL7).
- Emergency escalation requires explicit confirmation and patient control.

## Implementation Notes (AWS)

- Encrypt all data stores with KMS-managed keys.
- Use separate tenant IDs for data partitioning.
- Store only transcripts and structured outputs unless explicit retention is enabled.
- Centralize audit logs in DynamoDB and forward to SIEM if required.
