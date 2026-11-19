# NOOR GODOWN MANAGER

Android stock register with a Bangla interface and Bangladesh Taka (৳).

## Features
- Email/password sign-up and login
- Cloud database sync across phones using the same account
- User-owned records protected by Supabase Row Level Security
- Add, search, edit and delete products
- Opening stock, purchase price and sale price
- Stock IN / OUT with stock validation
- Daily, monthly and all-time transaction reports
- Correct or delete an erroneous stock transaction
- Data remains in the cloud when the app is reinstalled (sign in with the same account)

## Build
Run the GitHub Actions workflow **Build NOOR Godown Manager APK**. Download the artifact named **NOOR-GODOWN-MANAGER-APK**.

## Notes
Internet is required for cloud reads and writes. The app does not contain a Supabase service-role key; it uses a publishable key and owner-scoped RLS policies.
