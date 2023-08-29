import { Module } from '@nestjs/common';
import { HealthProfessionalAvailabilityController } from './controllers';

@Module({
   controllers: [HealthProfessionalAvailabilityController],
})
export class HealthProfessionalApiModule {}
