import { OnModuleInit } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { PrismaClient } from 'generated/prisma/client';
import { PaginationDto } from 'src/common';
export declare class ProductsService extends PrismaClient implements OnModuleInit {
    private readonly logger;
    onModuleInit(): void;
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
    findOne(id: number): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    update(id: number, updateProductDto: UpdateProductDto): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
    remove(id: number): Promise<{
        name: string;
        price: number;
        available: boolean;
        createdAt: Date;
        updatedAt: Date;
        id: number;
    }>;
}
