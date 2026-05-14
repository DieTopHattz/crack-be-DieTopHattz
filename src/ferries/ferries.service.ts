import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { SearchShipDto } from './dto/search-ship.dto';

@Injectable()
export class FerriesService {
  constructor(private prisma: PrismaService) {}

  async create(createShipDto: CreateShipDto) {
    return this.prisma.ship.create({
      data: {
        ...createShipDto,
        classes: createShipDto.classes || {},
        vehicleRates: createShipDto.vehicleRates || {},
        amenities: createShipDto.amenities || [],
        availableDates: createShipDto.availableDates || [],
      },
    });
  }

  async findAll() {
    return this.prisma.ship.findMany({
      where: { active: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async search(searchShipDto: SearchShipDto) {
    const { routeFrom, routeTo, date, type } = searchShipDto;
    
    const where: any = { active: true };
    
    if (routeFrom) where.routeFrom = routeFrom;
    if (routeTo) where.routeTo = routeTo;
    if (type) where.type = type;
    if (date) {
      where.availableDates = { has: date };
    }
    
    return this.prisma.ship.findMany({
      where,
      orderBy: { departureTime: 'asc' },
    });
  }

  async findOne(id: string) {
    const ship = await this.prisma.ship.findUnique({
      where: { id },
    });

    if (!ship) {
      throw new NotFoundException(`Ship with ID ${id} not found`);
    }

    return ship;
  }

  async update(id: string, updateShipDto: UpdateShipDto) {
    await this.findOne(id); // Check if exists
    
    return this.prisma.ship.update({
      where: { id },
      data: updateShipDto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    
    return this.prisma.ship.update({
      where: { id },
      data: { active: false },
    });
  }

  async getAvailableRoutes() {
    const ships = await this.prisma.ship.findMany({
      where: { active: true },
      select: { routeFrom: true, routeTo: true },
    });
    
    // Get unique routes
    const routes = new Map();
    ships.forEach(ship => {
      const key = `${ship.routeFrom}|${ship.routeTo}`;
      if (!routes.has(key)) {
        routes.set(key, { from: ship.routeFrom, to: ship.routeTo });
      }
    });
    
    return Array.from(routes.values());
  }
}