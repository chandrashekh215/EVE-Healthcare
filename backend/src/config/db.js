const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

let realPrisma = null;
let isRealPrismaAvailable = false;

// In-Memory Fallback Adapter
class InMemoryStore {
  constructor() {
    this.users = new Map();
    this.diagnosticCentres = new Map();
    this.diagnosticTests = new Map();
    this.bookings = new Map();
    this.payments = new Map();
    this.webhookEvents = new Map();
  }
}

const store = new InMemoryStore();

async function autoSeedInMemory() {
  if (store.users.size > 0) return;

  try {
    const hashedPassword = await bcrypt.hash('Password123!', 10);

    const u1 = { id: 'usr_priya', name: 'Priya Sharma', email: 'priya.sharma@example.com', password: hashedPassword, createdAt: new Date(Date.now() - 10000), updatedAt: new Date() };
    const u2 = { id: 'usr_rahul', name: 'Rahul Verma', email: 'rahul.verma@example.com', password: hashedPassword, createdAt: new Date(Date.now() - 9000), updatedAt: new Date() };
    const u3 = { id: 'usr_ananya', name: 'Ananya Deshmukh', email: 'ananya.deshmukh@example.com', password: hashedPassword, createdAt: new Date(Date.now() - 8000), updatedAt: new Date() };
    const u4 = { id: 'usr_vikram', name: 'Vikram Singh', email: 'vikram.singh@example.com', password: hashedPassword, createdAt: new Date(Date.now() - 7000), updatedAt: new Date() };

    [u1, u2, u3, u4].forEach((u) => store.users.set(u.id, u));

    const c1 = { id: 'centre_apex', name: 'Apex Hospital', location: 'Gurugram', createdAt: new Date(Date.now() - 6000), updatedAt: new Date() };
    const c2 = { id: 'centre_citycare', name: 'CityCare Diagnostics', location: 'Delhi', createdAt: new Date(Date.now() - 5000), updatedAt: new Date() };
    const c3 = { id: 'centre_medlife', name: 'MedLife Labs', location: 'Mumbai', createdAt: new Date(Date.now() - 4000), updatedAt: new Date() };
    const c4 = { id: 'centre_sunrise', name: 'Sunrise Health Centre', location: 'Bengaluru', createdAt: new Date(Date.now() - 3000), updatedAt: new Date() };
    const c5 = { id: 'centre_wellness', name: 'Wellness Point Diagnostics', location: 'Pune', createdAt: new Date(Date.now() - 2000), updatedAt: new Date() };

    [c1, c2, c3, c4, c5].forEach((c) => store.diagnosticCentres.set(c.id, c));

    const tests = [
      { id: 't1', centreId: c1.id, name: 'Complete Blood Count (CBC)', price: 350.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't2', centreId: c1.id, name: 'Lipid Profile', price: 750.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't3', centreId: c1.id, name: 'Thyroid Panel (T3/T4/TSH)', price: 650.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't4', centreId: c2.id, name: 'Liver Function Test (LFT)', price: 550.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't5', centreId: c2.id, name: 'Kidney Function Test (KFT)', price: 600.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't6', centreId: c3.id, name: 'Comprehensive Body Checkup', price: 1499.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't7', centreId: c4.id, name: 'COVID-19 RT-PCR Test', price: 550.00, createdAt: new Date(), updatedAt: new Date() },
      { id: 't8', centreId: c5.id, name: 'Vitamin D Total Test', price: 850.00, createdAt: new Date(), updatedAt: new Date() },
    ];
    tests.forEach((t) => store.diagnosticTests.set(t.id, t));

    const bookings = [
      { id: 'bkg_1', userId: u1.id, testId: 't1', centreId: c1.id, appointmentDatetime: new Date(Date.now() + 86400000 * 3), amount: 350.00, status: 'PENDING', createdAt: new Date(Date.now() - 1000), updatedAt: new Date() },
      { id: 'bkg_2', userId: u1.id, testId: 't3', centreId: c1.id, appointmentDatetime: new Date(Date.now() + 86400000 * 4), amount: 650.00, status: 'CONFIRMED', createdAt: new Date(Date.now() - 2000), updatedAt: new Date() },
      { id: 'bkg_3', userId: u2.id, testId: 't6', centreId: c3.id, appointmentDatetime: new Date(Date.now() + 86400000 * 5), amount: 1499.00, status: 'PENDING', createdAt: new Date(Date.now() - 3000), updatedAt: new Date() },
    ];
    bookings.forEach((b) => store.bookings.set(b.id, b));

    const p1 = { id: 'pay_1', bookingId: 'bkg_2', amount: 650.00, status: 'SUCCESS', providerReferenceId: 'SIM-PAY-1001', createdAt: new Date(), updatedAt: new Date() };
    store.payments.set(p1.id, p1);
  } catch (err) {
    console.error('Auto seed error:', err);
  }
}

// Initial Auto-Seed
autoSeedInMemory();

const createModelHandler = (mapName) => ({
  async create({ data, select, include }) {
    const id = data.id || `id_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const record = {
      id,
      ...data,
      createdAt: data.createdAt || now,
      updatedAt: data.updatedAt || now,
    };
    store[mapName].set(id, record);
    return this._format(record, include, select);
  },

  async findUnique({ where, include }) {
    for (const record of store[mapName].values()) {
      let match = true;
      for (const [key, val] of Object.entries(where)) {
        if (record[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) return this._format(record, include);
    }
    return null;
  },

  async findMany({ where = {}, skip = 0, take = 10, include, orderBy } = {}) {
    let results = [];
    for (const record of store[mapName].values()) {
      let match = true;
      for (const [key, val] of Object.entries(where)) {
        if (typeof val === 'object' && val !== null) {
          if (val.mode === 'insensitive' && val.contains) {
            if (!String(record[key] || '').toLowerCase().includes(val.contains.toLowerCase())) {
              match = false;
            }
          }
        } else if (record[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) results.push(this._format(record, include));
    }

    // Apply orderBy sorting if specified (e.g. orderBy: { createdAt: 'desc' })
    if (orderBy) {
      const field = Object.keys(orderBy)[0];
      const direction = orderBy[field];
      results.sort((a, b) => {
        let valA = a[field];
        let valB = b[field];
        if (valA instanceof Date) valA = valA.getTime();
        if (valB instanceof Date) valB = valB.getTime();
        if (typeof valA === 'string' && typeof valB === 'string') {
          return direction === 'desc' ? valB.localeCompare(valA) : valA.localeCompare(valB);
        }
        if (valA < valB) return direction === 'desc' ? 1 : -1;
        if (valA > valB) return direction === 'desc' ? -1 : 1;
        return 0;
      });
    }

    return results.slice(skip, skip + take);
  },

  async count({ where = {} } = {}) {
    let count = 0;
    for (const record of store[mapName].values()) {
      let match = true;
      for (const [key, val] of Object.entries(where)) {
        if (record[key] !== val) {
          match = false;
          break;
        }
      }
      if (match) count++;
    }
    return count;
  },

  async update({ where, data, include }) {
    const record = await this.findUnique({ where });
    if (!record) throw new Error('Record not found');
    const updated = {
      ...record,
      ...data,
      updatedAt: new Date(),
    };
    store[mapName].set(record.id, updated);
    return this._format(updated, include);
  },

  async upsert({ where, update, create }) {
    const existing = await this.findUnique({ where });
    if (existing) {
      return this.update({ where, data: update });
    }
    return this.create({ data: create });
  },

  async deleteMany() {
    store[mapName].clear();
    return { count: 0 };
  },

  _format(record, include, select) {
    if (!record) return null;
    const copy = { ...record };

    if (mapName === 'users' && select && !select.password) {
      delete copy.password;
    }

    if (include) {
      if (include.tests && mapName === 'diagnosticCentres') {
        copy.tests = Array.from(store.diagnosticTests.values()).filter((t) => t.centreId === record.id);
      }
      if (include.centre && (mapName === 'diagnosticTests' || mapName === 'bookings')) {
        copy.centre = store.diagnosticCentres.get(record.centreId);
      }
      if (include.test && mapName === 'bookings') {
        copy.test = store.diagnosticTests.get(record.testId);
      }
      if (include.payment && mapName === 'bookings') {
        copy.payment = Array.from(store.payments.values()).find((p) => p.bookingId === record.id) || null;
      }
    }

    return copy;
  },
});

const inMemoryPrisma = {
  user: createModelHandler('users'),
  diagnosticCentre: createModelHandler('diagnosticCentres'),
  diagnosticTest: createModelHandler('diagnosticTests'),
  booking: createModelHandler('bookings'),
  payment: createModelHandler('payments'),
  webhookEvent: createModelHandler('webhookEvents'),

  async $transaction(cb) {
    if (typeof cb === 'function') {
      return await cb(inMemoryPrisma);
    }
    return Promise.all(cb);
  },

  async $disconnect() {},
};

if (process.env.NODE_ENV !== 'test') {
  try {
    realPrisma = new PrismaClient({ log: ['error'] });
    realPrisma
      .$connect()
      .then(() => {
        isRealPrismaAvailable = true;
      })
      .catch(() => {
        isRealPrismaAvailable = false;
      });
  } catch (e) {
    isRealPrismaAvailable = false;
  }
}

// Universal Proxy routing calls to realPrisma (if available) or inMemoryPrisma
const dbProxy = new Proxy(inMemoryPrisma, {
  get(target, prop) {
    const activeTarget = isRealPrismaAvailable && realPrisma ? realPrisma : inMemoryPrisma;
    return activeTarget[prop];
  },
});

module.exports = dbProxy;
