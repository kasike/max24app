# Security Specification for Max24 App

## Data Invariants
1. A Product must have an ID, SKU, category, stock count, and non-negative pricing.
2. A Sale status tracker cannot have custom status overrides from non-admin accounts.
3. An Employee record's secure fields (such as role and salary) must only be modifiable by an Administrator.
4. Only authenticated users can access the application's underlying Firestore collections.

## The "Dirty Dozen" Malicious Exploitation Payloads
1. **Unauthenticated Write**: Creating a product document when not signed in.
2. **Identity Spoofing**: Attempting to create an employee record with a self-assigned 'Administrador' role using a fresh signed-in user ID.
3. **Price Manipulation**: Forcing a negative price on a product document (`price: -500`).
4. **Incorrect Schema Field Injection**: Writing a Product document containing `isVerifiedAdmin: true` (Malicious attribute poisoning).
5. **Unauthorized Supplier Modification**: Modifying product supplier details without valid tenant authentication.
6. **Unauthorized Sale Reading**: Attempting to download wholesale sales logs without being a logged-in employee of the business.
7. **License Hijacking**: Tampering with SaaS subscription licensing entries under `/storeOwners/` from regular operator accounts.
8. **Malicious Transaction Spoofing**: Setting up fake MercadoPago records claiming `$1,000,000 ARS` approved payment.
9. **Employee Salary Self-Modification**: A supervisor editing their own salary field to `$9,999,999 ARS`.
10. **Customer Balance Extinction**: Forcing `debtBalance: 0` on a highly indebted customer profile document.
11. **Store Settings Overwrite**: Overwriting the corporate business info document with vulgar metadata.
12. **System-Generated Category Tampering**: Injecting spam category records with names longer than 128 characters.

## Rules Verification Strategy
The ruleset forces:
1. Complete authentication checks via `request.auth != null`.
2. Schema validation with size limits on every field to prevent wallet disruption attacks.
3. Path checks on all updates to ensure strict attribute permission controls.
