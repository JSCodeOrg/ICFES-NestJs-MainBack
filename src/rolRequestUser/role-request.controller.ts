import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { RoleRequestService } from './role-request.service';
import { CreateRoleRequestDto } from './dto/create-role-request.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@Controller('role-requests')
@UseGuards(AuthGuard('jwt'))
export class RoleRequestController {
  constructor(private readonly roleRequestService: RoleRequestService) {}

  @Post()
  create(@Req() req, @Body() dto: CreateRoleRequestDto) {
    const { id, email, role } = req.user;
    const name = `${req.user.firstname ?? ''} ${req.user.lastname ?? ''}`.trim() || email;
    return this.roleRequestService.create(id, email, name, role, dto);
  }

  @Get('my')
  myRequest(@Req() req) {
    return this.roleRequestService.findByUser(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles('admin')
  findAll() {
    return this.roleRequestService.findAll();
  }

  @Get('pending')
  @UseGuards(RolesGuard)
  @Roles('admin')
  findPending() {
    return this.roleRequestService.findPending();
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles('admin')
  resolve(@Param('id') id: string, @Body('status') status: 'approved' | 'rejected') {
    return this.roleRequestService.resolve(id, status);
  }
}