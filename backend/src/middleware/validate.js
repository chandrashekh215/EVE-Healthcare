const validate = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const dataToValidate = req[source];
      const validatedData = await schema.parseAsync(dataToValidate);
      req[source] = validatedData;
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
