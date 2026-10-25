import type { VehicleRow, VehiclesRepository } from './vehicles.repository';

export interface VehiclesService {
  list(): Promise<VehicleRow[]>;
}

/** Vehicle and inventory rules; knows nothing about HTTP. */
export function createVehiclesService(vehicles: VehiclesRepository): VehiclesService {
  return {
    list() {
      return vehicles.list();
    },
  };
}
