import { IsUUID } from 'class-validator';

export class GetProductDetailDto {
  @IsUUID()
  id!: string;
}
