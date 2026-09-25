const webhooksService = require('../services/webhooks.service');
const { successResponse } = require('../utils/apiResponse');

class WebhooksController {
  async handlePaymentWebhook(req, res, next) {
    try {
      const result = await webhooksService.processPaymentWebhook({
        eventId: req.body.eventId,
        bookingId: req.body.bookingId,
        providerReferenceId: req.body.providerReferenceId,
        status: req.body.status,
        payload: req.body,
      });

      return successResponse(res, 200, result.message, result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new WebhooksController();
