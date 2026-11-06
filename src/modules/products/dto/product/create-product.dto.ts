import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  code!: string;

  @IsString()
  @MaxLength(100)
  @IsNotEmpty()
  name!: string;

  @IsUUID()
  @IsNotEmpty()
  brandId!: string;

  @IsUUID()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  description?: string;
}
