import { Controller, Get, Param, Query } from '@nestjs/common';
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
      @Param('hpId', ParseDatePipe) hpId: string,
      @Query('from', ParseDatePipe) from: Date,
      @Query('to', ParseDatePipe) to: Date,
   ): Promise<HealthProfessionalAvailabilityDTO[]> {
      return this.healthProfessionalService.getAvailabilities(hpId, from, to);
   }

   @Get('next')
   async getNextAvailability(
      @Param('hpId') hpId: string,
      @Query('date', ParseDatePipe) date: Date,
   ): Promise<HealthProfessionalAvailabilityDTO> {
      return this.healthProfessionalService.getNextAvailability(hpId, date);
   }
}
