import { env } from '~/config/environment'
export const WHITELIST_DOMAINS = [
  'http://localhost:5173'
  // Another the domain you want to whitelist
]

export const WEBSITE_DOMAIN = (env.BUILD_MODE === 'dev') ? env.WEBSITE_DOMAIN_DEVELOPMENT : env.WEBSITE_DOMAIN_PRODUCTION