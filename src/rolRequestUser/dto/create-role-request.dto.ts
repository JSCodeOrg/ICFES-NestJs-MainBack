import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRoleRequestDto {
  @IsString()
  @IsNotEmpty()
  requestedRole: string;

  @IsString()
  @IsOptional()
  reason?: string;
}