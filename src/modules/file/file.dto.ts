import { IsNotEmpty, IsString } from 'class-validator';

export class downloadDto {
  @IsNotEmpty()
  @IsString()
  url: string;
}
