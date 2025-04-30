/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'

const createNew = async (reqBody) => {
  try {
    // Data Processing logic
    const newAccount = {
      ...reqBody,
      slug: slugify(reqBody.fullName)
    }

    // Route to model -> next step

    // Must have return to avoid service infinite loop !
    return newAccount
  } catch (error) {
    throw error
  }
}
export const accountService = {
  createNew
}
