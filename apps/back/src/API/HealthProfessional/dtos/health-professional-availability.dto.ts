import { IHealthProfessionalAvailability } from '../../../Domain/HealthProfessional/interfaces';

export class HealthProfessionalAvailabilityDTO {
   startAt: Date;

   endAt: Date;

   constructor(data: IHealthProfessionalAvailability) {
      this.startAt = data.startAt;
      this.endAt = data.endAt;
   }
}
