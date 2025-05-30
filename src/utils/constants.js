import { env } from '~/config/environment'
export const WHITELIST_DOMAINS = [
  // 'http://localhost:5173' cause set for dev mode via cors.js
  'https://petbox-client.vercel.app',
  'http://localhost:3000',
  'http://localhost'
  // Another the domain you want to whitelist
]

export const WEBSITE_DOMAIN =
  env.BUILD_MODE === 'dev'
    ? env.WEBSITE_DOMAIN_DEVELOPMENT
    : env.WEBSITE_DOMAIN_PRODUCTION
