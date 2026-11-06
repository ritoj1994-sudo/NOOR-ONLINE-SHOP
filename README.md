# NOOR ONLINE SHOP

Bangla-first Expo marketplace app backed by Supabase.

## Features
- Public product catalogue and category filters
- Shopping cart and guest checkout
- Guest orders stored in Supabase with server-side price validation and stock deduction
- Store-admin sign-up/login, product creation/hiding, order listing and status updates
- Product image URL support

## Stack
- Expo SDK 54 / React Native
- Supabase Auth, Postgres and Row Level Security
- AsyncStorage for cart and session persistence

## First run
1. Install dependencies: `npm install`
2. Start Expo: `npx expo start`
3. Open the app in Expo Go or a development build.
4. For an Android test APK, sign in to Expo, run `npx eas-cli@latest init`, then run `npx eas-cli@latest build --platform android --profile preview`.
5. For a Play Store bundle, run `npx eas-cli@latest build --platform android --profile production`.
6. In Admin, create the store admin account using the configured owner email. Verify the email, then sign in.
7. Add real products, prices, stock counts and image URLs.

## Production requirements
- The Supabase publishable key is designed for public clients. Never add a service-role or secret key to this repository.
- Configure Supabase Auth email confirmation and redirect URLs before production.
- Configure EAS builds before distributing the Android app.
- bKash/Nagad are currently selected payment methods only; a merchant gateway and server-side payment verification are still required for online payments.
- Delivery fee is currently zero; courier integration is not configured.
- Add verified business contact details, privacy policy and terms before public launch.
