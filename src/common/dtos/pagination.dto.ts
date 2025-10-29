import { Type } from 'class-transformer';
import { IsOptional, IsPositive } from 'class-validator';

/**
 * DTO común de paginación
 * Usado en todas las consultas que requieren paginación
 */
export class PaginationDto {
  @IsPositive() // Debe ser número positivo
  @IsOptional() // Campo opcional
  @Type(() => Number) // Transforma string a número
  page?: number; // Página actual (default: 1)

  @IsPositive()
  @IsOptional()
  @Type(() => Number)
  limit?: number; // Cantidad de registros por página (default: 10)
}
