import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

export class AttributeDto {
  @IsUUID()
  @IsNotEmpty()
  attributeId!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class CreateProductVariantDto {
  @IsUUID()
  @IsNotEmpty()
  productId!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Trim()
  @IsOptional()
  @IsString()
  barcode?: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price phải là số tiền hợp lệ',
  })
  costPrice!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price phải là số tiền hợp lệ',
  })
  sellingPrice!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}

export function Trim() {
  return Transform(({ value }) =>
    typeof value === 'string' ? value.trim() : value,
  );
}
