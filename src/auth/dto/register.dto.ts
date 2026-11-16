import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { trimString } from '../../common/utils/trim';

export class RegisterDto {
  @ApiProperty({ example: 'Ava Shah', maxLength: 80 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(80)
  name: string;

  @ApiProperty({ example: 'ava@demo.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail()
  email: string;

  @ApiProperty({ minLength: 8, maxLength: 72, example: 'Demo1234' })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;
}
