import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma/client';
import { PaginationDto } from 'src/common';

/**
 * Servicio de productos
 * Extiende PrismaClient para acceso directo a la base de datos
 * Implementa OnModuleInit para conectar Prisma al iniciar
 */
@Injectable()
export class ProductsService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductsService.name);

  /**
   * Conectar Prisma al inicializar el módulo
   */
  async onModuleInit() {
    await this.$connect();
    this.logger.log('Prisma Client connected to the database');
  }

  /**
   * Crear nuevo producto
   */
  create(createProductDto: CreateProductDto) {
    return this.product.create({ data: createProductDto });
  }

  /**
   * Obtener productos con paginación
   * Solo retorna productos disponibles (available: true)
   */
  async findAll(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;

    // Contar total de productos disponibles
    const totalProducts = await this.product.count({
      where: { available: true },
    });
    const lastPage = Math.ceil(totalProducts / limit);

    return {
      data: await this.product.findMany({
        skip: (page - 1) * limit, // Offset
        take: limit, // Limit
        where: { available: true },
      }),
      meta: {
        page: page,
        total: totalProducts,
        lastPage: lastPage,
      },
    };
  }

  /**
   * Buscar producto por ID
   * Lanza NotFoundException si no existe o no está disponible
   */
  async findOne(id: number) {
    const product = await this.product.findFirst({
      where: { id, available: true },
    });

    if (!product) {
      throw new NotFoundException(`Product with id #${id} not found`);
    }

    return product;
  }

  /**
   * Actualizar producto
   * Verifica que exista antes de actualizar
   */
  async update(id: number, updateProductDto: UpdateProductDto) {
    const { id: __, ...data } = updateProductDto; // Remover id del DTO

    await this.findOne(id); // Verificar existencia

    return this.product.update({
      where: { id },
      data: data,
    });
  }

  /**
   * Eliminar producto (Soft Delete)
   * No elimina físicamente, solo marca como no disponible
   */
  async remove(id: number) {
    await this.findOne(id); // Verificar existencia

    // Hard delete (comentado)
    // return this.product.delete({ where: { id } });

    // Soft delete: marcar como no disponible
    const product = await this.product.update({
      where: { id },
      data: { available: false },
    });

    return product;
  }
}
