import twilio from 'twilio'
import { BusinessLogicError, ERROR_CODES } from '~/utils/apiError'
import { env } from '~/utils/environment'

const client = twilio(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN)

const sendVerification = async to => {
  return await client.verify.v2
    .services(env.TWILIO_SERVICE_SID)
    .verifications.create({ to, channel: 'sms' })
}

const checkVerification = async (to, code) => {
  try {
    return await client.verify.v2
      .services(env.TWILIO_SERVICE_SID)
      .verificationChecks.create({ to, code })
  } catch (error) {
    throw new BusinessLogicError(
      ERROR_CODES.OTP_EXPIRED,
      'Your OTP has expired/ reach max attemp. Please request a new one!'
    )
  }
}

export const TwilioProvider = { sendVerification, checkVerification }
