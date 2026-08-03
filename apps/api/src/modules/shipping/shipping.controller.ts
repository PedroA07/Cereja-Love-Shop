import { Controller, Get, Query } from '@nestjs/common';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';
import { ShippingService } from './shipping.service';

class QuoteQueryDto {
  @IsOptional()
  @IsString()
  @Length(2, 2)
  state?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  subtotalCents!: number;
}

@Controller('shipping')
export class ShippingController {
  constructor(private readonly shipping: ShippingService) {}

  @Get('quote')
  quote(@Query() query: QuoteQueryDto) {
    return {
      options: this.shipping.quote({ state: query.state, subtotalCents: query.subtotalCents }),
      freeShippingThresholdCents: this.shipping.freeShippingThresholdCents,
    };
  }
}
