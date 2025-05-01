/* eslint-disable no-useless-catch */
import { slugify } from '~/utils/formatters'
import { accountModel } from '~/models/accountModel'

const createNew = async (reqBody) => {
  try {
    // Data Processing logic
    const newAccount = {
      ...reqBody,
      slug: slugify(reqBody.fullName)
    }

    // Route to model -> next step
    const createdAccount = await accountModel.createNew(newAccount)

    // Retrive record from database if needed for frontend porpose
    const getNewAccount = await accountModel.findOneById(createdAccount.insertedId)

    // Must have return to avoid service infinite loop !
    return getNewAccount
  } catch (error) {
    throw error
  }
}
export const accountService = {
  createNew
}
