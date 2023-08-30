import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { HealthProfessionalAvailabilityDTO } from '../dtos';
import { HealthProfessionalService } from '../../../Domain/HealthProfessional/services';
import { ParseDatePipe } from '../../../Utils';

@Controller({
   path: 'health-professionals/:hpId/availabilities',
})
export class HealthProfessionalAvailabilityController {
   constructor(
      private readonly healthProfessionalService: HealthProfessionalService,
   ) {}

   @Get()
   async getAvailabilities(
      @Param('hpId', ParseIntPipe) hpId: number,
      @Query('from', ParseDatePipe) from: Date,
      @Query('to', ParseDatePipe) to: Date,
   ): Promise<HealthProfessionalAvailabilityDTO[]> {
      const data = await this.healthProfessionalService.getAvailabilities(
         hpId,
         from,
         to,
      );
      return data.map((v) => new HealthProfessionalAvailabilityDTO(v));
   }

   @Get('next')
   async getNextAvailability(
      @Param('hpId', ParseIntPipe) hpId: number,
      @Query('date', ParseDatePipe) date: Date,
   ): Promise<HealthProfessionalAvailabilityDTO> {
      const data = await this.healthProfessionalService.getNextAvailability(
         hpId,
         date,
      );
      return new HealthProfessionalAvailabilityDTO(data);
   }
}
