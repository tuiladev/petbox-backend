import { StatusCodes } from 'http-status-codes'
import { accountService } from '~/services/accountService'

const createNew = async (req, res, next) => {
  try {
    // Controller will recived the data already validated by the middleware | validation (body, cookies, params, querys, ...)
    console.log('req.body: ', req.body)
    console.log('req.query: ', req.query)
    console.log('req.params: ', req.params)
    console.log('req.cookies: ', req.cookies)
    console.log('req.headers: ', req.headers)
    console.log('req.files: ', req.files)

    // Route to services layer to excute data -> next to model layer
    const createdAccount = await accountService.createNew(req.body)

    // After all, data comback here and controller respond to the client
    res.status(StatusCodes.CREATED).json(createdAccount)
  } catch (error) {
    next(error)
  }
}

export const accountController = {
  createNew
}
