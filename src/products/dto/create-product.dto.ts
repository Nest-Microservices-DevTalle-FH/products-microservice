import { Type } from 'class-transformer';
import { IsNumber, IsString, Min } from 'class-validator';

/**
 * DTO para crear un producto
 * Valida estructura y tipos de datos entrantes
 */
export class CreateProductDto {
  @IsString()
  public name: string;

  @IsNumber({
    maxDecimalPlaces: 4, // Máximo 4 decimales (ej: 99.9999)
  })
  @Min(0) // Precio no puede ser negativo
  @Type(() => Number) // Transforma string a número
  public price: number;
}
