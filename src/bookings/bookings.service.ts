import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createBookingDto: CreateBookingDto) {
    // Generate unique booking ID
    const bookingId = `FRY-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const totalAmount = (createBookingDto.classPrice * createBookingDto.passengerCount) 
      + (createBookingDto.vehicleFee || 0);

    const booking = await this.prisma.booking.create({
      data: {
        bookingId,
        userId,
        ...createBookingDto,
        totalAmount,
        status: 'CONFIRMED',
      },
      include: {
        ship: true,
      },
    });

    return booking;
  }

  async findAll() {
    return this.prisma.booking.findMany({
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        ship: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        ship: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        ship: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async findByBookingId(bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { bookingId },
      include: {
        ship: true,
      },
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    return booking;
  }

  async cancel(id: string) {
    const booking = await this.findOne(id);

    if (booking.status !== 'CONFIRMED') {
      throw new Error('Only confirmed bookings can be cancelled');
    }

    return this.prisma.booking.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }
}