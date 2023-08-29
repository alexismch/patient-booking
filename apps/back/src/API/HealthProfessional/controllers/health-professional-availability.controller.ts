import { Controller, Get, Param, Query } from '@nestjs/common';
import { HealthProfessionalAvailabilityDTO } from '../dtos';

@Controller({
   path: 'health-professionals/:hpId/availabilities',
})
export class HealthProfessionalAvailabilityController {
   @Get()
   async getAvailabilities(
      @Param('hpId') hpId: string,
      @Query('from') from: Date,
      @Query('to') to: Date,
   ): Promise<HealthProfessionalAvailabilityDTO[]> {
      return [];
   }

   @Get('next')
   async getNextAvailability(
      @Param('hpId') hpId: string,
      @Query('date') date: Date,
   ): Promise<HealthProfessionalAvailabilityDTO> {
      return null;
   }
}
