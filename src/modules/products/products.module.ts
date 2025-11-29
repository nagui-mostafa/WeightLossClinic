import { Module } from '@nestjs/common';
import { CommonModule } from '../common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [CommonModule],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],
})
export class ProductsModule {}
