declare global {
  namespace NodeJS {
    interface ProcessEnv {
      EXPO_PUBLIC_SUPABASE_URL: string;
      EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY: string;
      EXPO_PUBLIC_REVENUECAT_API_KEY: string;
      STRIPE_SECRET_KEY: string;
      STRIPE_WEBHOOK_SECRET: string;
      STRIPE_PRICE_ID_MONTHLY: string;
      STRIPE_PRICE_ID_YEARLY: string;
      DOMAIN: string;
      ELEVENLABS_API_KEY: string;
      SENTRY_DSN: string;
      SENTRY_ORG: string;
      SENTRY_PROJECT: string;
      SENTRY_AUTH_TOKEN: string;
    }
  }
}

export {};