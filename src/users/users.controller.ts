import { Controller, Get, Patch, Post, Body, UseGuards, Param } from '@nestjs/common';                          
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getProfile(@GetUser('id') userId: string) {
    return this.usersService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(@GetUser('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateProfile(userId, updateUserDto);
  }

  @Post('change-password')
  changePassword(@GetUser('id') userId: string, @Body() changePasswordDto: ChangePasswordDto) {
    return this.usersService.changePassword(userId, changePasswordDto);
  }

  @Get()
  getAllUsers() {
    return this.usersService.getAllUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }
}