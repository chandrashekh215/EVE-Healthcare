const express = require('express');
const testsController = require('../controllers/tests.controller');
const validate = require('../middleware/validate');
const { getTestsSchema } = require('../schemas/centre.schema');

const router = express.Router();

/**
 * @swagger
 * /tests:
 *   get:
 *     summary: Search and list all diagnostic tests across centres
 *     tags: [Diagnostic Tests]
 *     parameters:
 *       - in: query
 *         name: centreId
 *         schema:
 *           type: string
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Paginated list of diagnostic tests
 */
router.get('/', validate(getTestsSchema, 'query'), testsController.getTests);

module.exports = router;
