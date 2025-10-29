import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';

/**
 * Módulo principal de la aplicación
 * Importa todos los módulos funcionales
 */
@Module({
  imports: [ProductsModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
