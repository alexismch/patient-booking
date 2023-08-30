import { Injectable } from '@nestjs/common';
import { HealthProfessionalRepository } from '../../../Persistence/HealthProfessional';
import { IHealthProfessionalAvailability } from '../interfaces';
// import { Availability } from '@prisma/client';

@Injectable()
export class HealthProfessionalService {
   constructor(
      private readonly healthProfessionalRepository: HealthProfessionalRepository,
   ) {}

   async getAvailabilities(
      hpId: number,
      from = new Date(),
      to?: Date,
   ): Promise<IHealthProfessionalAvailability[]> {
      if (!to) {
         to = new Date(from);
         to.setHours(23);
         to.setMinutes(59);
         to.setSeconds(59);
      }

      const healthProfessional =
         await this.healthProfessionalRepository.getById(hpId, {
            include: {
               availabilities: true,
               events: {
                  from,
                  to,
               },
            },
         });

      // const hpAvailabilities = healthProfessional.availabilities.reduce(
      //    (prev, cur) => prev.set(cur.day, cur),
      //    new Map<number, Availability>(),
      // );
      //
      // const availabilities: IHealthProfessionalAvailability[] = [];
      //
      // const newAvailability: Partial<IHealthProfessionalAvailability> = {};
      // for (let i = 0; i < healthProfessional.events.length; i++) {
      //    const event = healthProfessional.events[i];
      //    const hpAvailability = hpAvailabilities.get(event.from.getDay());
      //    console.log(hpAvailability);
      // }

      return [];
   }

   async getNextAvailability(
      hpId: number,
      from = new Date(),
   ): Promise<IHealthProfessionalAvailability> {
      const healthProfessional =
         await this.healthProfessionalRepository.getById(hpId, {
            include: {
               availabilities: true,
               events: {
                  from,
               },
            },
         });
      // console.log(healthProfessional);
      return null;
   }
}
