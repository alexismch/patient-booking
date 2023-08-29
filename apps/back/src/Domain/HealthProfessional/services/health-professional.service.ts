import { Injectable } from '@nestjs/common';
import { HealthProfessionalRepository } from '../../../Persistence/HealthProfessional';

@Injectable()
export class HealthProfessionalService {
   constructor(
      private readonly healthProfessionalRepository: HealthProfessionalRepository,
   ) {}
}
