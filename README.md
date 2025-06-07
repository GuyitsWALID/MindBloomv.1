# Mindbloom - Mental Health & Wellness App

A comprehensive mental health and wellness application built with Expo Router, featuring AI-powered insights, mood tracking, journaling, and flexible premium subscription management.

## Features

### Core Features
- **Mood Tracking**: Track daily moods with AI-powered insights
- **Journal**: Write and reflect with AI-generated insights
- **Virtual Garden**: Grow plants based on wellness activities
- **Meditation**: Guided meditation sessions with customizable durations
- **Analytics**: Comprehensive wellness analytics and progress tracking

### Premium Features
- **AI Wellness Coach**: Unlimited personalized insights and coaching
- **Advanced Analytics**: Deep insights with predictive analytics
- **Custom Meditation Library**: 200+ guided meditations
- **Data Export**: Download complete wellness data
- **Premium Themes**: Beautiful customization options
- **Priority Support**: 24/7 expert support
- **Family Sharing**: Share with up to 4 family members
- **Mood Prediction**: AI-powered mood forecasting

## Flexible Pricing Plans

### Weekly Premium - $2.99/week
- Perfect for trying out premium features
- 3-day free trial
- Weekly billing flexibility
- All core premium features

### Monthly Premium - $9.99/month (Most Popular)
- Most flexible option with monthly billing
- 7-day free trial
- Save 23% vs weekly billing
- Full premium feature access

### Yearly Premium - $79.99/year (Best Value)
- Best value with significant savings
- 14-day free trial
- Save 33% vs monthly billing
- Save 48% vs weekly billing
- Exclusive yearly-only features

## Payment Integration

This app includes comprehensive payment integration supporting both web and mobile platforms:

### Web Payments (Stripe)
- Secure checkout sessions
- Customer portal for subscription management
- Webhook handling for subscription events
- PCI DSS compliant processing
- Support for all three pricing tiers

### Mobile Payments (RevenueCat)
- App Store and Google Play billing integration
- Cross-platform subscription management
- Receipt validation and entitlement management

### Setup Instructions

#### Stripe Setup (Web)
1. Create a Stripe account at https://stripe.com
2. Get your API keys from the Stripe Dashboard
3. Create products and prices for each plan:
   - Weekly Premium: $2.99/week
   - Monthly Premium: $9.99/month
   - Yearly Premium: $79.99/year
4. Set up your environment variables:
   ```
   EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   STRIPE_PRICE_ID_WEEKLY=price_...
   STRIPE_PRICE_ID_MONTHLY=price_...
   STRIPE_PRICE_ID_YEARLY=price_...
   ```

#### RevenueCat Setup (Mobile)
1. Create a RevenueCat account at https://www.revenuecat.com
2. Set up your app in the RevenueCat dashboard
3. Configure your products in App Store Connect and Google Play Console:
   - Weekly Premium: $2.99/week
   - Monthly Premium: $9.99/month
   - Yearly Premium: $79.99/year
4. **Important**: RevenueCat requires native code and will not work in the browser preview
5. To enable mobile purchases:
   - Export your project using `npx expo export`
   - Follow the RevenueCat Expo integration guide: https://www.revenuecat.com/docs/getting-started/installation/expo
   - Install the RevenueCat SDK: `expo install react-native-purchases`
   - Create a development build using Expo Dev Client

#### Environment Variables
Create a `.env` file with the following variables:
```
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Stripe (Web Payments)
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_WEEKLY=price_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_YEARLY=price_...

# RevenueCat (Mobile Payments)
EXPO_PUBLIC_REVENUECAT_API_KEY=your_revenuecat_api_key

# Domain (for Stripe redirects)
DOMAIN=https://your-domain.com
```

## Tech Stack

- **Framework**: Expo Router 4.0.17 with Expo SDK 52
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payments**: Stripe (Web) + RevenueCat (Mobile)
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **Fonts**: Inter (via @expo-google-fonts)

## Project Structure

```
app/
├── _layout.tsx                 # Root layout with providers
├── (auth)/                     # Authentication screens
├── (tabs)/                     # Main tab navigation
│   ├── index.tsx              # Home screen
│   ├── journal.tsx            # Journal screen
│   ├── garden.tsx             # Virtual garden
│   ├── analytics.tsx          # Analytics dashboard
│   ├── premium.tsx            # Premium subscription
│   └── profile.tsx            # User profile
├── activities/                 # Wellness activities
├── premium/                   # Premium success pages
└── api/                       # API routes for payments

components/                     # Reusable components
contexts/                      # React contexts
lib/                           # Utilities and services
├── database.ts                # Supabase database operations
├── supabase.ts               # Supabase client
└── payments/                 # Payment services
    ├── index.ts              # Payment manager
    ├── stripe.ts             # Stripe integration
    └── revenuecat.ts         # RevenueCat integration

src/                           # Configuration files
├── stripe-config.ts          # Stripe product configuration

types/                         # TypeScript type definitions
```

## Pricing Strategy

The app offers three flexible pricing tiers to accommodate different user preferences:

### Pricing Breakdown
- **Weekly**: $2.99/week ($12.96/month equivalent)
- **Monthly**: $9.99/month (23% savings vs weekly)
- **Yearly**: $79.99/year ($6.67/month equivalent, 33% savings vs monthly)

### Savings Calculation
- Monthly vs Weekly: Save 23%
- Yearly vs Monthly: Save 33%
- Yearly vs Weekly: Save 48%

### Trial Periods
- Weekly: 3-day free trial
- Monthly: 7-day free trial
- Yearly: 14-day free trial

## Getting Started

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables**:
   - Copy `.env.example` to `.env`
   - Fill in your Supabase, Stripe, and RevenueCat credentials

3. **Set up Supabase**:
   - Create a new Supabase project
   - Run the migrations in `supabase/migrations/`
   - Configure Row Level Security policies

4. **Configure Stripe Products**:
   - Create three products in Stripe Dashboard
   - Update price IDs in `src/stripe-config.ts`
   - Set up webhooks for subscription events

5. **Start the development server**:
   ```bash
   npm run dev
   ```

6. **For mobile payments**:
   - Export the project: `npx expo export`
   - Follow RevenueCat integration guide
   - Create development build with Expo Dev Client

## Database Schema

The app uses Supabase with the following main tables:
- `users` - User profiles
- `mood_entries` - Daily mood tracking
- `journal_entries` - Journal entries with AI insights
- `plants` - Virtual garden plants
- `wellness_activities` - Completed wellness activities
- `user_subscriptions` - Premium subscription management
- `subscription_features` - Available premium features
- `stripe_customers` - Stripe customer mapping
- `stripe_subscriptions` - Stripe subscription data
- `stripe_orders` - One-time payment records

## Deployment

### Web Deployment
1. Configure Stripe webhooks for your production domain
2. Set production environment variables
3. Deploy to your preferred hosting platform (Vercel, Netlify, etc.)

### Mobile Deployment
1. Complete RevenueCat integration
2. Configure App Store Connect and Google Play Console
3. Build and submit to app stores using EAS Build

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on both web and mobile
5. Submit a pull request

## License

This project is licensed under the MIT License.