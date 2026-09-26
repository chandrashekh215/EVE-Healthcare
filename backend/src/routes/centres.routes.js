const express = require('express');
const centresController = require('../controllers/centres.controller');
const validate = require('../middleware/validate');
const { authenticateJWT } = require('../middleware/auth');
const {
  createCentreSchema,
  getCentresSchema,
  addTestSchema,
  getCentreTestsSchema,
} = require('../schemas/centre.schema');

const router = express.Router();


/**
 * @swagger
 * /centres:
 *   post:
 *     summary: Create a diagnostic centre
 *     tags: [Diagnostic Centres]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, location]
 *             properties:
 *               name:
 *                 type: string
 *                 example: HealthCare Lab Central
 *               location:
 *                 type: string
 *                 example: Downtown Medical Plaza
 *     responses:
 *       201:
 *         description: Diagnostic centre created
 *   get:
 *     summary: List diagnostic centres with pagination
 *     tags: [Diagnostic Centres]
 *     parameters:
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
 *         description: List of diagnostic centres
 */
router.post('/', authenticateJWT, validate(createCentreSchema), centresController.createCentre);
router.get('/', validate(getCentresSchema, 'query'), centresController.getCentres);

/**
 * @swagger
 * /centres/{id}:
 *   get:
 *     summary: Get centre detail including available tests
 *     tags: [Diagnostic Centres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Centre details with test catalog
 *       404:
 *         description: Centre not found
 */
router.get('/:id', centresController.getCentreById);

/**
 * @swagger
 * /centres/{id}/tests:
 *   get:
 *     summary: List tests belonging to a diagnostic centre with pagination
 *     tags: [Diagnostic Centres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
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
 *         description: Paginated list of tests for the centre
 *       404:
 *         description: Centre not found
 *   post:
 *     summary: Add a diagnostic test to a centre
 *     tags: [Diagnostic Centres]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, price]
 *             properties:
 *               name:
 *                 type: string
 *                 example: Complete Blood Count (CBC)
 *               price:
 *                 type: number
 *                 example: 49.99
 *     responses:
 *       201:
 *         description: Diagnostic test added successfully
 *       404:
 *         description: Centre not found
 */
router.get('/:id/tests', validate(getCentreTestsSchema, 'query'), centresController.getCentreTests);
router.post('/:id/tests', authenticateJWT, validate(addTestSchema), centresController.addTestToCentre);

module.exports = router;
