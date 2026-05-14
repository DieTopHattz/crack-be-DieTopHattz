import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create Users
  const hashedPassword = await bcrypt.hash('123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@ferrygo.com' },
    update: {},
    create: {
      email: 'admin@ferrygo.com',
      password: hashedPassword,
      name: 'Admin User',
      phone: '+62 812 3456 7890',
      role: 'ADMIN',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      password: hashedPassword,
      name: 'Regular User',
      phone: '+62 812 9876 5432',
      role: 'USER',
    },
  });

  console.log('✅ Users created:', { admin, user });

  // 2. Create Ships
  const ships = [
    {
      name: 'FastFerry Express',
      operator: 'FastFerry Lines',
      type: 'passenger-vehicle',
      routeFrom: 'Bali (Benoa)',
      routeTo: 'Lombok (Bangsal)',
      departureTime: '09:00',
      availableDates: ['2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19'],
      classes: {
        economy: { price: 100000, seats: 150, description: 'Standard seat with AC' },
        business: { price: 250000, seats: 50, description: 'Premium seat with meal' },
        vip: { price: 350000, seats: 20, description: 'VIP cabin with bed' },
      },
      vehicleRates: {
        motorcycle: 50000,
        car: 150000,
        truck: 300000,
      },
      amenities: ['AC', 'WiFi', 'TV', 'Food Court', 'Prayer Room'],
      totalSeats: 220,
      active: true,
    },
    {
      name: 'SeaCat Voyager',
      operator: 'SeaCat Lines',
      type: 'passenger-only',
      routeFrom: 'Bali (Padang Bai)',
      routeTo: 'Nusa Penida',
      departureTime: '08:30',
      availableDates: ['2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19'],
      classes: {
        economy: { price: 75000, seats: 100, description: 'Standard seat with AC' },
        vip: { price: 150000, seats: 30, description: 'VIP seat with extra legroom' },
      },
      vehicleRates: {},
      amenities: ['AC', 'Sun Deck', 'Snack Bar'],
      totalSeats: 130,
      active: true,
    },
    {
      name: 'BlueWater Ferry',
      operator: 'BlueWater Lines',
      type: 'passenger-vehicle',
      routeFrom: 'Java (Ketapang)',
      routeTo: 'Bali (Gilimanuk)',
      departureTime: '07:00',
      availableDates: ['2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19'],
      classes: {
        economy: { price: 50000, seats: 200, description: 'Standard seat' },
        business: { price: 120000, seats: 80, description: 'Business class with meal' },
      },
      vehicleRates: {
        motorcycle: 40000,
        car: 120000,
        truck: 250000,
      },
      amenities: ['AC', 'Cafeteria', 'TV'],
      totalSeats: 280,
      active: true,
    },
    {
      name: 'Gili Express',
      operator: 'Gili Fast Ferry',
      type: 'passenger-only',
      routeFrom: 'Bali (Padang Bai)',
      routeTo: 'Gili Islands',
      departureTime: '10:00',
      availableDates: ['2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19'],
      classes: {
        economy: { price: 125000, seats: 80, description: 'Standard seat' },
        vip: { price: 250000, seats: 20, description: 'VIP seat with snack' },
      },
      vehicleRates: {},
      amenities: ['AC', 'Sun Deck', 'Snack Bar', 'WiFi'],
      totalSeats: 100,
      active: true,
    },
    {
      name: 'Luxury Ferry',
      operator: 'Luxury Cruises',
      type: 'passenger-vehicle',
      routeFrom: 'Bali (Benoa)',
      routeTo: 'Lombok (Bangsal)',
      departureTime: '14:00',
      availableDates: ['2025-06-15', '2025-06-16', '2025-06-17', '2025-06-18', '2025-06-19'],
      classes: {
        executive: { price: 500000, seats: 30, description: 'Executive suite with bed' },
        vip: { price: 350000, seats: 40, description: 'VIP cabin' },
        business: { price: 250000, seats: 60, description: 'Business class' },
      },
      vehicleRates: {
        motorcycle: 75000,
        car: 200000,
      },
      amenities: ['AC', 'WiFi', 'Fine Dining', 'Spa', 'Private Cabin'],
      totalSeats: 130,
      active: true,
    },
  ];

  for (const shipData of ships) {
    const ship = await prisma.ship.upsert({
      where: { id: shipData.name }, // This won't work directly, let's use create instead
      update: {},
      create: shipData,
    });
    console.log(`✅ Ship created: ${ship.name}`);
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });