const getStoreInfo = async (req, res, next) => {
  const { code } = req.params
  return next(code)
}

export const storeController = {
  getStoreInfo
}
