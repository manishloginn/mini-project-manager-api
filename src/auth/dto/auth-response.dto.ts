import { ApiProperty } from '@nestjs/swagger';
import { PublicUserDto } from '../../users/user.presenter';

export class AuthResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty({ type: PublicUserDto })
  user: PublicUserDto;
}
