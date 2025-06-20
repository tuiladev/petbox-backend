import { env } from '~/utils/environment'
export const WHITELIST_DOMAINS = ['https://petbox-client.vercel.app']

export const WEBSITE_DOMAIN =
  env.BUILD_MODE !== 'production'
    ? env.WEBSITE_DOMAIN_DEVELOPMENT
    : env.WEBSITE_DOMAIN_PRODUCTION
