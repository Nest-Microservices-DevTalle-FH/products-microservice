"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var ProductsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("../../generated/prisma/client/index.js");
let ProductsService = ProductsService_1 = class ProductsService extends client_1.PrismaClient {
    logger = new common_1.Logger(ProductsService_1.name);
    onModuleInit() {
        this.$connect();
        this.logger.log('Prisma Client connected to the database');
    }
    create(createProductDto) {
        return this.product.create({ data: createProductDto });
    }
    async findAll(paginationDto) {
        const { limit = 10, page = 1 } = paginationDto;
        const totalProducts = await this.product.count({
            where: { available: true },
        });
        const lastPage = Math.ceil(totalProducts / limit);
        return {
            data: await this.product.findMany({
                skip: (page - 1) * limit,
                take: limit,
                where: { available: true },
            }),
            meta: {
                page: page,
                total: totalProducts,
                lastPage: lastPage,
            },
        };
    }
    async findOne(id) {
        const product = await this.product.findFirst({
            where: { id, available: true },
        });
        if (!product) {
            throw new common_1.NotFoundException(`Product with id #${id} not found`);
        }
        return product;
    }
    async update(id, updateProductDto) {
        await this.findOne(id);
        return this.product.update({
            where: { id },
            data: updateProductDto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        const product = await this.product.update({
            where: { id },
            data: {
                available: false,
            },
        });
        return product;
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = ProductsService_1 = __decorate([
    (0, common_1.Injectable)()
], ProductsService);
//# sourceMappingURL=products.service.js.map