import type { Vehicle, VehiclesRepository } from './vehicles.repository';

export interface VehiclesService {
  list(): Promise<Vehicle[]>;
}

/** Vehicle and inventory rules; knows nothing about HTTP. */
export function createVehiclesService(vehicles: VehiclesRepository): VehiclesService {
  return {
    list() {
      return vehicles.list();
    },
  };
}
