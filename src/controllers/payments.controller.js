const paymentsService = require('../services/payments.service');
const { successResponse } = require('../utils/apiResponse');

class PaymentsController {
  async processPayment(req, res, next) {
    try {
      const result = await paymentsService.processPayment(req.user.id, req.body);
      return successResponse(res, 200, 'Payment processed successfully', result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentsController();
