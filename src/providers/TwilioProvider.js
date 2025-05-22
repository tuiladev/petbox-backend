import twilio from 'twilio'
import { env } from '~/config/environment'

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

const sendVerification = async to => {
  return await client.verify.v2
    .services(env.TWILIO_SERVICE_SID)
    .verifications.create({ to, channel: 'sms' })
}

const checkVerification = async (to, code) => {
  return await client.verify.v2
    .services(env.TWILIO_SERVICE_SID)
    .verificationChecks.create({ to, code })
}

export const TwilioProvider = { sendVerification, checkVerification }
