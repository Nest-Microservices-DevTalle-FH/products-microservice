import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

/**
 * Módulo de productos
 * Encapsula toda la lógica relacionada con productos
 */
@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
