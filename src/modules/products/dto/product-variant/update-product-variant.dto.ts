import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { ProductVariantStatus } from './get-product-variant-query.dto';
import { AttributeDto, Trim } from './create-product-variant.dto';
import { Type } from 'class-transformer';

export class UpdateProductVariantDto {
  @Trim()
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name?: string;

  @Trim()
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  sku?: string;

  @Trim()
  @ValidateIf((_, value) => value !== undefined && value !== null)
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  barcode?: string | null;

  @Trim()
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price phải là số tiền hợp lệ',
  })
  costPrice?: string;

  @Trim()
  @ValidateIf((_, value) => value !== undefined)
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d+(\.\d{1,2})?$/, {
    message: 'Price phải là số tiền hợp lệ',
  })
  sellingPrice?: string;

  @ValidateIf((_, value) => value !== undefined)
  @IsEnum(ProductVariantStatus)
  status?: ProductVariantStatus;
  @ValidateIf((_, value) => value !== undefined)
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes?: AttributeDto[];
}

export type ExistingVariantAttribute = {
  id: string;
  attributeId: string;
  value: string;
};
