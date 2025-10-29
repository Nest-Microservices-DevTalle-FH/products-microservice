import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PaginationDto } from 'src/common';
export declare class ProductsController {
    private readonly productsService;
    constructor(productsService: ProductsService);
    create(createProductDto: CreateProductDto): import("generated/prisma/client").Prisma.Prisma__ProductClient<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }, never, import("generated/prisma/client/runtime/library").DefaultArgs, import("generated/prisma/client").Prisma.PrismaClientOptions>;
    findAll(paginationDto: PaginationDto): Promise<{
        data: {
            name: string;
            price: number;
            available: boolean;
            createdAt: Date;
            updatedAt: Date;
            id: number;
        }[];
        meta: {
            page: number;
            total: number;
            lastPage: number;
        };
    }>;
    findOne(id: string): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    update(id: string, updateProductDto: UpdateProductDto): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    remove(id: string): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}
