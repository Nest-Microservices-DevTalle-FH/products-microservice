import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsNumber, IsPositive } from 'class-validator';

/**
 * DTO para actualizar un producto
 * Hereda de CreateProductDto pero todos los campos son opcionales (PartialType)
 * Agrega campo ID requerido
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsNumber()
  @IsPositive()
  id: number;
}
