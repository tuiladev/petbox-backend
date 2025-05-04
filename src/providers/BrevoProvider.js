const brevo = require('@getbrevo/brevo')
import { env } from '~/config/environment'

let apiInstance = new brevo.TransactionalEmailsApi()
let apiKey = apiInstance.authentications['apiKey']
apiKey.apiKey = env.BREVO_API_KEY

const sendEmail = async (userEmail, customSubject, customHtmlContent) => {
  let sendSmtpEmail = new brevo.SendSmtpEmail()

  sendSmtpEmail.subject = customSubject
  sendSmtpEmail.htmlContent = customHtmlContent
  sendSmtpEmail.sender = { name: env.ADMIN_EMAIL_NAME, email: env.ADMIN_EMAIL_ADDRESS }

  sendSmtpEmail.to = [
    { email: userEmail }
  ]

  return apiInstance.sendTransacEmail(sendSmtpEmail)
}
export const BrevoProvider = {
  sendEmail
}