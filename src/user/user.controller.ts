import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { ApiResponse } from '@nestjs/swagger';
import { CreateUserDto } from './dto/createUserDto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  @ApiResponse({ status: 201, description: "Usuario registrado exitosamente." })
  @ApiResponse({ status: 409, description: "Este email ya se encuentra registrado." })
  register(@Body() body: CreateUserDto){
    return this.userService.register(body);
  }


}
