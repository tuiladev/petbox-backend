import { StatusCodes } from 'http-status-codes'

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

    // After all, data comback here and controller respond to the client
    res.status(StatusCodes.CREATED).json({ message: 'POST: account created' })
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      errors: error.message
    })
  }
}

export const accountController = {
  createNew
}
