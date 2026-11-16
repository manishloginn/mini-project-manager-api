import { ApiProperty } from '@nestjs/swagger';
import { UserDocument } from './schemas/user.schema';

export class PublicUserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  email: string;
}

export function toPublicUser(user: UserDocument): PublicUserDto {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
  };
}
