import type { NewVehicle, Vehicle, VehiclesRepository } from './vehicles.repository';

export interface VehiclesService {
  list(): Promise<Vehicle[]>;
  create(input: NewVehicle): Promise<Vehicle>;
}

/** Vehicle and inventory rules; knows nothing about HTTP. */
export function createVehiclesService(vehicles: VehiclesRepository): VehiclesService {
  return {
    list() {
      return vehicles.list();
    },

    create(input) {
      return vehicles.create(input);
    },
  };
}
