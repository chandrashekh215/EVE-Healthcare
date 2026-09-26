const prisma = require('../config/db');
const { NotFoundError } = require('../utils/errors');

class CentresService {
  /**
   * Create a new diagnostic centre
   */
  async createCentre({ name, location }) {
    return await prisma.diagnosticCentre.create({
      data: {
        name,
        location,
      },
    });
  }

  /**
   * List centres with pagination support (?page=&pageSize= or ?limit=&offset=)
   */
  async getCentres(queryParams) {
    let page = Number(queryParams.page) || 1;
    let pageSize = Number(queryParams.pageSize) || 10;

    if (queryParams.limit) {
      pageSize = Number(queryParams.limit);
    }
    if (queryParams.offset !== undefined) {
      page = Math.floor(Number(queryParams.offset) / pageSize) + 1;
    }

    const skip = (page - 1) * pageSize;

    const [items, totalItems] = await Promise.all([
      prisma.diagnosticCentre.findMany({
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diagnosticCentre.count(),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }

  /**
   * Get centre details including its available tests
   */
  async getCentreById(id) {
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id },
      include: {
        tests: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${id}' not found`);
    }

    return centre;
  }

  /**
   * Add a diagnostic test to a centre
   */
  async addTestToCentre(centreId, { name, price }) {
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${centreId}' not found`);
    }

    return await prisma.diagnosticTest.create({
      data: {
        centreId,
        name,
        price,
      },
    });
  }

  /**
   * List tests belonging to a specific centre with pagination
   */
  async getCentreTests(centreId, queryParams = {}) {
    const centre = await prisma.diagnosticCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new NotFoundError(`Diagnostic centre with ID '${centreId}' not found`);
    }

    let page = Number(queryParams.page) || 1;
    let pageSize = Number(queryParams.pageSize) || 10;

    if (queryParams.limit) {
      pageSize = Number(queryParams.limit);
    }
    if (queryParams.offset !== undefined) {
      page = Math.floor(Number(queryParams.offset) / pageSize) + 1;
    }

    const skip = (page - 1) * pageSize;
    const where = { centreId };

    const [items, totalItems] = await Promise.all([
      prisma.diagnosticTest.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diagnosticTest.count({ where }),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }

  /**
   * Search / list all diagnostic tests with filters
   */
  async getTests(queryParams = {}) {
    let page = Number(queryParams.page) || 1;
    let pageSize = Number(queryParams.pageSize) || 10;

    if (queryParams.limit) {
      pageSize = Number(queryParams.limit);
    }
    if (queryParams.offset !== undefined) {
      page = Math.floor(Number(queryParams.offset) / pageSize) + 1;
    }

    const skip = (page - 1) * pageSize;

    const where = {};
    if (queryParams.centreId) {
      where.centreId = queryParams.centreId;
    }
    if (queryParams.name) {
      where.name = {
        contains: queryParams.name,
        mode: 'insensitive',
      };
    }

    const [items, totalItems] = await Promise.all([
      prisma.diagnosticTest.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          centre: {
            select: {
              id: true,
              name: true,
              location: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.diagnosticTest.count({ where }),
    ]);

    return {
      items,
      totalItems,
      page,
      pageSize,
    };
  }
}

module.exports = new CentresService();
