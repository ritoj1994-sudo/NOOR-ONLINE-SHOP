# NOOR ONLINE SHOP

Bangladesh-focused multi-category marketplace starter app built with Expo / React Native.

## Included
- Bangla storefront, category filters and product search
- Cart quantity controls and total calculation
- Customer name, phone and delivery address
- COD, bKash and Nagad payment choices (payment credentials are intentionally placeholders)
- WhatsApp order handoff to 01838345812
- Local product add/remove admin screen
- Local persistence on the same device with AsyncStorage

## Run
1. Install Node.js and Expo tooling on a computer.
2. Run `npm install`
3. Run `npx expo start`
4. Scan the QR code using Expo Go.

## Important before public launch
This is a starter app, not a production marketplace. Product/admin data is stored only on the device. There is no shared cloud database, secure admin authentication, courier API, payment gateway integration, order dashboard, inventory synchronization, or production build. Do not collect real customer/payment data until these are implemented and tested. Add real bKash/Nagad merchant payment integration only through official merchant APIs and never store secret keys in the app.
