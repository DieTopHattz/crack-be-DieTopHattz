import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { FerriesService } from './ferries.service';
import { CreateShipDto } from './dto/create-ship.dto';
import { UpdateShipDto } from './dto/update-ship.dto';
import { SearchShipDto } from './dto/search-ship.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorators';

@Controller('ferries')
export class FerriesController {
  constructor(private readonly ferriesService: FerriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  create(@Body() createShipDto: CreateShipDto) {
    return this.ferriesService.create(createShipDto);
  }

  @Get()
  findAll() {
    return this.ferriesService.findAll();
  }

  @Get('search')
  search(@Query() searchShipDto: SearchShipDto) {
    return this.ferriesService.search(searchShipDto);
  }

  @Get('routes')
  getAvailableRoutes() {
    return this.ferriesService.getAvailableRoutes();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ferriesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() updateShipDto: UpdateShipDto) {
    return this.ferriesService.update(id, updateShipDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.ferriesService.remove(id);
  }
}