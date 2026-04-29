import { BadRequestException, Injectable } from '@nestjs/common';
import { MovementRefType, MovementType, Prisma } from '@prisma/client';
import { parse } from 'csv-parse/sync';

import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { resolveOperationalBranchId } from '../../common/utils/branch-scope.util';
import { decimalToNumber, toDecimal } from '../../common/utils/decimal.util';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditLogService } from '../audit-log/audit-log.service';
import { BrandsService } from '../brands/brands.service';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductsCsvDto } from './dto/import-products-csv.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ImportProductsResultDto } from './entities/import-products-result.dto';
import { ProductResponseDto } from './entities/product-response.dto';

type ProductWithBrand = Prisma.ProductGetPayload<{
  include: { brand: true };
}>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly brandsService: BrandsService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async create(
    actor: AuthenticatedUser,
    dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const brand = await this.resolveBrand(dto.brandId, dto.brandName);
    const product = await this.prisma.product.create({
      data: {
        brandId: brand.id,
        name: dto.name.trim(),
        barcode: this.normalizeBarcode(dto.barcode),
        requiresWeight: dto.requiresWeight ?? false,
        defaultPrice: toDecimal(dto.defaultPrice),
        siatEnabled: dto.siatEnabled ?? false,
        isActive: dto.isActive ?? true,
      },
      include: {
        brand: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'CREATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        name: product.name,
        brandId: product.brandId,
      },
    });

    return this.toResponse(product);
  }

  async findAll(query: ProductListQueryDto): Promise<ProductResponseDto[]> {
    const products = await this.prisma.product.findMany({
      where: {
        siatEnabled: query.siatEnabled,
        isActive: query.isActive,
        ...(query.search
          ? {
              OR: [
                { name: { contains: query.search, mode: 'insensitive' } },
                { barcode: { contains: query.search, mode: 'insensitive' } },
                {
                  brand: {
                    name: { contains: query.search, mode: 'insensitive' },
                  },
                },
              ],
            }
          : {}),
      },
      include: {
        brand: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products.map((product) => this.toResponse(product));
  }

  async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        brand: true,
      },
    });

    return this.toResponse(product);
  }

  async update(
    actor: AuthenticatedUser,
    id: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const current = await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

    const brand =
      dto.brandId || dto.brandName
        ? await this.resolveBrand(dto.brandId, dto.brandName)
        : null;

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        brandId: brand?.id,
        name: dto.name?.trim(),
        barcode:
          dto.barcode !== undefined
            ? this.normalizeBarcode(dto.barcode)
            : undefined,
        requiresWeight: dto.requiresWeight,
        defaultPrice:
          dto.defaultPrice !== undefined
            ? toDecimal(dto.defaultPrice)
            : undefined,
        siatEnabled: dto.siatEnabled,
        isActive: dto.isActive,
      },
      include: {
        brand: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'UPDATE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        previousName: current.name,
        newName: product.name,
      },
    });

    return this.toResponse(product);
  }

  async remove(
    actor: AuthenticatedUser,
    id: string,
  ): Promise<ProductResponseDto> {
    const current = await this.prisma.product.findUniqueOrThrow({
      where: { id },
    });

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        isActive: false,
      },
      include: {
        brand: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'DELETE_PRODUCT',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        name: current.name,
        softDelete: true,
      },
    });

    return this.toResponse(product);
  }

  async uploadPhoto(
    actor: AuthenticatedUser,
    id: string,
    file: Express.Multer.File | undefined,
  ): Promise<ProductResponseDto> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar una imagen.');
    }

    const product = await this.prisma.product.update({
      where: { id },
      data: {
        photoUrl: `/uploads/products/${file.filename}`,
      },
      include: {
        brand: true,
      },
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'UPLOAD_PRODUCT_PHOTO',
      entity: 'Product',
      entityId: product.id,
      metadata: {
        photoUrl: product.photoUrl,
      },
    });

    return this.toResponse(product);
  }

  async importFromCsv(
    actor: AuthenticatedUser,
    dto: ImportProductsCsvDto,
    file: Express.Multer.File | undefined,
  ): Promise<ImportProductsResultDto> {
    if (!file) {
      throw new BadRequestException('Debe adjuntar un archivo CSV.');
    }

    const branchId = resolveOperationalBranchId(actor, dto.branchId);
    await this.ensureActiveBranch(branchId);

    const rows: Record<string, string>[] = parse(
      file.buffer.toString('utf-8'),
      {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true,
      },
    );

    if (!rows.length) {
      throw new BadRequestException(
        'El archivo CSV no contiene filas válidas.',
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let createdProducts = 0;
      let updatedProducts = 0;
      let stockRowsProcessed = 0;

      for (const [index, row] of rows.entries()) {
        const brandName = this.pickCsvValue(row, ['Marca', 'marca', 'brand']);
        const productName = this.pickCsvValue(row, [
          'producto',
          'Producto',
          'name',
          'nombre',
        ]);

        if (!brandName || !productName) {
          throw new BadRequestException(
            `La fila ${index + 1} del CSV debe incluir Marca y producto.`,
          );
        }

        const quantity = this.parseCsvNumber(
          this.pickCsvValue(row, ['cantidad', 'Cantidad']),
          `cantidad en fila ${index + 1}`,
          0,
        );
        const priceValue = this.pickCsvValue(row, [
          'precio',
          'Precio',
          'defaultPrice',
        ]);
        const barcode = this.normalizeBarcode(
          this.pickCsvValue(row, [
            'barcode',
            'codigo_barras',
            'Código de barras',
          ]),
        );
        const requiresWeight = this.parseCsvBoolean(
          this.pickCsvValue(row, ['requiresWeight', 'peso', 'requierePeso']),
        );
        const siatEnabled = this.parseCsvBoolean(
          this.pickCsvValue(row, ['siatEnabled', 'siat', 'facturacion']),
        );
        const brand = await this.brandsService.findOrCreateByName(
          brandName,
          tx,
        );

        const existingProduct = barcode
          ? await tx.product.findUnique({ where: { barcode } })
          : await tx.product.findFirst({
              where: {
                brandId: brand.id,
                name: productName.trim(),
              },
            });

        const defaultPrice = priceValue
          ? toDecimal(
              this.parseCsvNumber(priceValue, `precio en fila ${index + 1}`, 0),
            )
          : toDecimal(existingProduct?.defaultPrice ?? 0);

        const product = existingProduct
          ? await tx.product.update({
              where: { id: existingProduct.id },
              data: {
                brandId: brand.id,
                name: productName.trim(),
                barcode,
                defaultPrice,
                requiresWeight,
                siatEnabled,
              },
            })
          : await tx.product.create({
              data: {
                brandId: brand.id,
                name: productName.trim(),
                barcode,
                defaultPrice,
                requiresWeight,
                siatEnabled,
              },
            });

        if (existingProduct) {
          updatedProducts += 1;
        } else {
          createdProducts += 1;
        }

        if (quantity > 0) {
          await tx.stock.upsert({
            where: {
              branchId_productId: {
                branchId,
                productId: product.id,
              },
            },
            update: {
              quantity: {
                increment: toDecimal(quantity),
              },
            },
            create: {
              branchId,
              productId: product.id,
              quantity: toDecimal(quantity),
            },
          });

          await tx.inventoryMovement.create({
            data: {
              branchId,
              productId: product.id,
              type: MovementType.IN,
              quantity: toDecimal(quantity),
              unitPrice: defaultPrice,
              refType: MovementRefType.CSV_IMPORT,
              notes: 'Importación masiva desde CSV.',
            },
          });

          stockRowsProcessed += 1;
        }
      }

      return {
        createdProducts,
        updatedProducts,
        stockRowsProcessed,
      };
    });

    await this.auditLogService.log({
      userId: actor.sub,
      action: 'IMPORT_PRODUCTS_CSV',
      entity: 'Product',
      metadata: {
        branchId,
        fileName: file.originalname,
        ...result,
      },
    });

    return {
      ...result,
      branchId,
    };
  }

  private async resolveBrand(brandId?: string, brandName?: string) {
    if (brandId) {
      return this.prisma.brand.findUniqueOrThrow({
        where: { id: brandId },
      });
    }

    if (brandName) {
      return this.brandsService.findOrCreateByName(brandName);
    }

    throw new BadRequestException(
      'Debe indicar brandId o brandName para el producto.',
    );
  }

  private async ensureActiveBranch(branchId: string): Promise<void> {
    const branch = await this.prisma.branch.findUniqueOrThrow({
      where: { id: branchId },
    });

    if (!branch.isActive) {
      throw new BadRequestException('La sucursal seleccionada está inactiva.');
    }
  }

  private normalizeBarcode(barcode?: string | null): string | null {
    const normalized = barcode?.trim();
    return normalized ? normalized : null;
  }

  private pickCsvValue(
    row: Record<string, string>,
    keys: string[],
  ): string | undefined {
    for (const key of keys) {
      if (row[key] !== undefined && row[key] !== '') {
        return row[key];
      }
    }

    return undefined;
  }

  private parseCsvNumber(
    value: string | undefined,
    fieldName: string,
    min?: number,
  ): number {
    const parsed = Number(value ?? 0);

    if (Number.isNaN(parsed)) {
      throw new BadRequestException(`Valor inválido para ${fieldName}.`);
    }

    if (min !== undefined && parsed < min) {
      throw new BadRequestException(
        `El valor de ${fieldName} debe ser mayor o igual a ${min}.`,
      );
    }

    return parsed;
  }

  private parseCsvBoolean(value?: string): boolean {
    if (!value) {
      return false;
    }

    return ['true', '1', 'si', 'sí', 'yes'].includes(value.toLowerCase());
  }

  private toResponse(product: ProductWithBrand): ProductResponseDto {
    return {
      id: product.id,
      brand: product.brand,
      name: product.name,
      barcode: product.barcode,
      requiresWeight: product.requiresWeight,
      defaultPrice: decimalToNumber(product.defaultPrice) ?? 0,
      photoUrl: product.photoUrl,
      siatEnabled: product.siatEnabled,
      isActive: product.isActive,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
