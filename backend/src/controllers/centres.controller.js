const centresService = require('../services/centres.service');
const { successResponse, paginatedResponse } = require('../utils/apiResponse');

class CentresController {
  async createCentre(req, res, next) {
    try {
      const centre = await centresService.createCentre(req.body);
      return successResponse(res, 201, 'Diagnostic centre created successfully', centre);
    } catch (error) {
      next(error);
    }
  }

  async getCentres(req, res, next) {
    try {
      const { items, totalItems, page, pageSize } = await centresService.getCentres(req.query);
      return paginatedResponse(res, 200, 'Diagnostic centres retrieved successfully', items, page, pageSize, totalItems);
    } catch (error) {
      next(error);
    }
  }

  async getCentreById(req, res, next) {
    try {
      const centre = await centresService.getCentreById(req.params.id);
      return successResponse(res, 200, 'Diagnostic centre details retrieved successfully', centre);
    } catch (error) {
      next(error);
    }
  }

  async addTestToCentre(req, res, next) {
    try {
      const test = await centresService.addTestToCentre(req.params.id, req.body);
      return successResponse(res, 201, 'Diagnostic test added to centre successfully', test);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CentresController();
