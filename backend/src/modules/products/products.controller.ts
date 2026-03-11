import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { productPhotoMulterOptions } from '../../common/utils/file-upload.util';
import { CreateProductDto } from './dto/create-product.dto';
import { ImportProductsCsvDto } from './dto/import-products-csv.dto';
import { ProductListQueryDto } from './dto/product-list-query.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UploadProductPhotoDto } from './dto/upload-product-photo.dto';
import { ImportProductsResultDto } from './entities/import-products-result.dto';
import { ProductResponseDto } from './entities/product-response.dto';
import { ProductsService } from './products.service';

@ApiTags('Productos')
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar productos' })
  @ApiOkResponse({ type: ProductResponseDto, isArray: true })
  findAll(@Query() query: ProductListQueryDto): Promise<ProductResponseDto[]> {
    return this.productsService.findAll(query);
  }

  @Post()
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Crear producto' })
  @ApiCreatedResponse({ type: ProductResponseDto })
  create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: CreateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.create(actor, dto);
  }

  @Post('import/csv')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Importar productos y stock desde CSV' })
  @ApiOkResponse({ type: ImportProductsResultDto })
  importCsv(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ImportProductsCsvDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ImportProductsResultDto> {
    return this.productsService.importFromCsv(actor, dto, file);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener producto por ID' })
  @ApiOkResponse({ type: ProductResponseDto })
  findOne(@Param('id') id: string): Promise<ProductResponseDto> {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Editar producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    return this.productsService.update(actor, id, dto);
  }

  @Post(':id/photo')
  @Roles(UserRole.OWNER, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', productPhotoMulterOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Subir foto de producto' })
  @ApiOkResponse({ type: ProductResponseDto })
  uploadPhoto(
    @CurrentUser() actor: AuthenticatedUser,
    @Param('id') id: string,
    @Body() _body: UploadProductPhotoDto,
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    return this.productsService.uploadPhoto(actor, id, file);
  }
}
