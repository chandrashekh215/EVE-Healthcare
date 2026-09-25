const authService = require('../services/auth.service');
const { successResponse } = require('../utils/apiResponse');

class AuthController {
  async signup(req, res, next) {
    try {
      const user = await authService.signup(req.body);
      return successResponse(res, 201, 'User registered successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const result = await authService.login(req.body);
      return successResponse(res, 200, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
