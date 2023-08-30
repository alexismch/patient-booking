import { Injectable } from '@nestjs/common';
import { HealthProfessionalRepository } from '../../../Persistence/HealthProfessional';

@Injectable()
export class HealthProfessionalService {
   constructor(
      private readonly healthProfessionalRepository: HealthProfessionalRepository,
   ) {}

   async getAvailabilities(hpId: string, from?: Date, to?: Date) {
      return [];
   }

   async getNextAvailability(hpId: string, date?: Date) {
      return null;
   }
}
