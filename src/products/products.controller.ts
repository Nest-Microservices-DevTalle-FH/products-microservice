import { Controller, ParseIntPipe } from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common';
import { MessagePattern, Payload } from '@nestjs/microservices';

/**
 * Controlador de productos (Microservicio)
 * Usa @MessagePattern en lugar de @Get, @Post, etc.
 * Los decoradores HTTP están comentados como referencia
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  /**
   * Crear producto
   * Patrón Request-Response: espera respuesta del microservicio
   */
  @MessagePattern({ cmd: 'create_product' })
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  /**
   * Obtener todos los productos con paginación
   */
  @MessagePattern({ cmd: 'find_all_products' })
  findAll(@Payload() paginationDto: PaginationDto) {
    return this.productsService.findAll(paginationDto);
  }

  /**
   * Obtener un producto por ID
   */
  @MessagePattern({ cmd: 'find_one_product' })
  findOne(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.findOne(id);
  }

  /**
   * Actualizar producto
   * El ID viene dentro del UpdateProductDto
   */
  @MessagePattern({ cmd: 'update_product' })
  update(@Payload() updateProductDto: UpdateProductDto) {
    return this.productsService.update(updateProductDto.id, updateProductDto);
  }

  /**
   * Eliminar producto (soft delete)
   * Cambia available a false en lugar de eliminar físicamente
   */
  @MessagePattern({ cmd: 'remove_product' })
  remove(@Payload('id', ParseIntPipe) id: number) {
    return this.productsService.remove(id);
  }
}
