const centresService = require('../services/centres.service');
const { paginatedResponse } = require('../utils/apiResponse');

class TestsController {
  async getTests(req, res, next) {
    try {
      const { items, totalItems, page, pageSize } = await centresService.getTests(req.query);
      return paginatedResponse(res, 200, 'Diagnostic tests retrieved successfully', items, page, pageSize, totalItems);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TestsController();
