const prisma = require('../src/config/db');
const { hashPassword } = require('../src/utils/hash');

async function seed() {
  console.log('🌱 Starting EVE Healthcare Database Seeding...\n');

  try {
    // ----------------------------------------------------
    // 1. Seed Users
    // ----------------------------------------------------
    console.log('👤 Seeding Users...');
    const defaultPassword = 'Password123!';
    const hashedPassword = await hashPassword(defaultPassword);

    const usersData = [
      { name: 'Priya Sharma', email: 'priya.sharma@example.com', password: hashedPassword },
      { name: 'Rahul Verma', email: 'rahul.verma@example.com', password: hashedPassword },
      { name: 'Ananya Deshmukh', email: 'ananya.deshmukh@example.com', password: hashedPassword },
      { name: 'Vikram Singh', email: 'vikram.singh@example.com', password: hashedPassword },
    ];

    const seededUsers = [];
    for (const userData of usersData) {
      let user = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (!user) {
        user = await prisma.user.create({
          data: userData,
        });
        console.log(`  ✓ Created user: ${user.name} (${user.email})`);
      } else {
        console.log(`  - User already exists: ${user.name} (${user.email})`);
      }
      seededUsers.push(user);
    }

    // ----------------------------------------------------
    // 2. Seed Diagnostic Centres & Tests
    // ----------------------------------------------------
    console.log('\n🏥 Seeding Diagnostic Centres & Tests...');
    const centresData = [
      {
        name: 'Apex Hospital',
        location: 'Gurugram',
        tests: [
          { name: 'Complete Blood Count (CBC)', price: 350.00 },
          { name: 'Lipid Profile', price: 750.00 },
          { name: 'Thyroid Panel (T3/T4/TSH)', price: 650.00 },
          { name: 'HbA1c (Diabetes Screen)', price: 450.00 },
          { name: 'COVID-19 RT-PCR Test', price: 600.00 },
          { name: 'Vitamin D Total Test', price: 990.00 },
        ],
      },
      {
        name: 'CityCare Diagnostics',
        location: 'Delhi',
        tests: [
          { name: 'Liver Function Test (LFT)', price: 550.00 },
          { name: 'Kidney Function Test (KFT)', price: 600.00 },
          { name: 'Malaria Antigen Test', price: 250.00 },
          { name: 'Complete Blood Count (CBC)', price: 380.00 },
          { name: 'Chest X-Ray Single View', price: 400.00 },
          { name: 'Dengue NS1 Antigen', price: 500.00 },
        ],
      },
      {
        name: 'MedLife Labs',
        location: 'Mumbai',
        tests: [
          { name: 'Comprehensive Body Checkup', price: 1499.00 },
          { name: 'Lipid Profile', price: 800.00 },
          { name: 'Vitamin B12 Test', price: 700.00 },
          { name: 'Thyroid Panel (T3/T4/TSH)', price: 600.00 },
          { name: 'HbA1c (Diabetes Screen)', price: 490.00 },
          { name: 'Urine Routine & Microscopy', price: 200.00 },
        ],
      },
      {
        name: 'Sunrise Health Centre',
        location: 'Bengaluru',
        tests: [
          { name: 'Complete Blood Count (CBC)', price: 320.00 },
          { name: 'COVID-19 RT-PCR Test', price: 550.00 },
          { name: 'Cardiac Markers Panel', price: 1200.00 },
          { name: 'Liver Function Test (LFT)', price: 500.00 },
          { name: 'Kidney Function Test (KFT)', price: 580.00 },
          { name: 'Allergy Comprehensive Screen', price: 1800.00 },
        ],
      },
      {
        name: 'Wellness Point Diagnostics',
        location: 'Pune',
        tests: [
          { name: 'Vitamin D Total Test', price: 850.00 },
          { name: 'Thyroid Panel (T3/T4/TSH)', price: 550.00 },
          { name: 'Chest X-Ray Single View', price: 350.00 },
          { name: 'HbA1c (Diabetes Screen)', price: 420.00 },
          { name: 'Malaria Antigen Test', price: 220.00 },
        ],
      },
    ];

    const seededCentres = [];
    const seededTests = [];

    for (const cData of centresData) {
      let centre = (await prisma.diagnosticCentre.findMany({ where: { name: cData.name } }))[0];

      if (!centre) {
        centre = await prisma.diagnosticCentre.create({
          data: {
            name: cData.name,
            location: cData.location,
          },
        });
        console.log(`  ✓ Created Centre: ${centre.name} (${centre.location})`);
      } else {
        console.log(`  - Centre already exists: ${centre.name}`);
      }
      seededCentres.push(centre);

      for (const tData of cData.tests) {
        let test = (await prisma.diagnosticTest.findMany({
          where: { centreId: centre.id, name: tData.name },
        }))[0];

        if (!test) {
          test = await prisma.diagnosticTest.create({
            data: {
              centreId: centre.id,
              name: tData.name,
              price: tData.price,
            },
          });
          console.log(`    └─ Added Test: ${test.name} (₹${test.price})`);
        }
        seededTests.push({ ...test, centreName: centre.name });
      }
    }

    // ----------------------------------------------------
    // 3. Seed Bookings & Payments
    // ----------------------------------------------------
    console.log('\n📅 Seeding Appointments & Payment Records...');

    const now = new Date();

    const bookingsPlan = [
      // PENDING Bookings (No payment yet)
      {
        userIndex: 0, // Priya
        testName: 'Complete Blood Count (CBC)',
        centreName: 'Apex Hospital',
        daysInFuture: 3,
        status: 'PENDING',
      },
      {
        userIndex: 1, // Rahul
        testName: 'Lipid Profile',
        centreName: 'MedLife Labs',
        daysInFuture: 5,
        status: 'PENDING',
      },
      {
        userIndex: 2, // Ananya
        testName: 'COVID-19 RT-PCR Test',
        centreName: 'Sunrise Health Centre',
        daysInFuture: 2,
        status: 'PENDING',
      },

      // CONFIRMED Bookings (Has SUCCESS Payment)
      {
        userIndex: 0, // Priya
        testName: 'Thyroid Panel (T3/T4/TSH)',
        centreName: 'Apex Hospital',
        daysInFuture: 4,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
      },
      {
        userIndex: 1, // Rahul
        testName: 'Liver Function Test (LFT)',
        centreName: 'CityCare Diagnostics',
        daysInFuture: 7,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
      },
      {
        userIndex: 2, // Ananya
        testName: 'Vitamin D Total Test',
        centreName: 'Wellness Point Diagnostics',
        daysInFuture: 10,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
      },
      {
        userIndex: 3, // Vikram
        testName: 'Comprehensive Body Checkup',
        centreName: 'MedLife Labs',
        daysInFuture: 14,
        status: 'CONFIRMED',
        paymentStatus: 'SUCCESS',
      },

      // FAILED Bookings (Has FAILED Payment)
      {
        userIndex: 0, // Priya
        testName: 'HbA1c (Diabetes Screen)',
        centreName: 'Apex Hospital',
        daysInFuture: 6,
        status: 'FAILED',
        paymentStatus: 'FAILED',
      },
      {
        userIndex: 3, // Vikram
        testName: 'Kidney Function Test (KFT)',
        centreName: 'CityCare Diagnostics',
        daysInFuture: 8,
        status: 'FAILED',
        paymentStatus: 'FAILED',
      },

      // CANCELLED Bookings
      {
        userIndex: 1, // Rahul
        testName: 'Chest X-Ray Single View',
        centreName: 'CityCare Diagnostics',
        daysInFuture: 12,
        status: 'CANCELLED',
      },
    ];

    let createdBookingsCount = 0;
    let createdPaymentsCount = 0;

    for (const bPlan of bookingsPlan) {
      const user = seededUsers[bPlan.userIndex];
      const targetTest = seededTests.find(
        (t) => t.name === bPlan.testName && t.centreName === bPlan.centreName
      );

      if (!user || !targetTest) continue;

      // Check if similar booking exists for this user and test
      const existingBooking = (await prisma.booking.findMany({
        where: {
          userId: user.id,
          testId: targetTest.id,
        },
      }))[0];

      let booking = existingBooking;

      if (!booking) {
        const appointmentDate = new Date(now.getTime() + bPlan.daysInFuture * 86400000);

        booking = await prisma.booking.create({
          data: {
            userId: user.id,
            testId: targetTest.id,
            centreId: targetTest.centreId,
            appointmentDatetime: appointmentDate,
            amount: targetTest.price, // Snapshot price
            status: bPlan.status,
          },
        });
        createdBookingsCount++;
        console.log(
          `  ✓ Booking: [${booking.status}] for ${user.name} - ${targetTest.name} at ${targetTest.centreName}`
        );
      }

      // Seed matching Payment record if CONFIRMED or FAILED
      if (bPlan.paymentStatus && booking) {
        const existingPayment = await prisma.payment.findUnique({
          where: { bookingId: booking.id },
        });

        if (!existingPayment) {
          const providerRef = `SIM-PAY-${Math.floor(100000 + Math.random() * 900000)}`;
          await prisma.payment.create({
            data: {
              bookingId: booking.id,
              amount: booking.amount,
              status: bPlan.paymentStatus,
              providerReferenceId: providerRef,
            },
          });
          createdPaymentsCount++;
          console.log(`    └─ Payment Record: [${bPlan.paymentStatus}] Ref: ${providerRef}`);
        }
      }
    }

    // ----------------------------------------------------
    // Summary
    // ----------------------------------------------------
    console.log('\n==================================================');
    console.log('🎉 EVE Healthcare Database Seeding Completed!');
    console.log('==================================================');
    console.log(` Users Seeded:           ${seededUsers.length}`);
    console.log(` Centres Seeded:         ${seededCentres.length}`);
    console.log(` Tests Seeded:           ${seededTests.length}`);
    console.log(` Bookings Created:       ${createdBookingsCount}`);
    console.log(` Payments Seeded:        ${createdPaymentsCount}`);
    console.log('==================================================\n');
    console.log('🔑 Demo Login Credentials (Password for all: Password123!)');
    console.log('   - Priya Sharma:    priya.sharma@example.com');
    console.log('   - Rahul Verma:     rahul.verma@example.com');
    console.log('   - Ananya Deshmukh: ananya.deshmukh@example.com');
    console.log('   - Vikram Singh:    vikram.singh@example.com');
    console.log('==================================================\n');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
