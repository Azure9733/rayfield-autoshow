import type {
  NewVehicle,
  Vehicle,
  VehicleFilters,
  VehiclesRepository,
  VehicleUpdate,
} from './vehicles.repository';

export interface VehiclesService {
  list(): Promise<Vehicle[]>;
  search(filters: VehicleFilters): Promise<Vehicle[]>;
  create(input: NewVehicle): Promise<Vehicle>;
  update(id: string, input: VehicleUpdate): Promise<Vehicle>;
}

/** Vehicle and inventory rules; knows nothing about HTTP. */
export function createVehiclesService(vehicles: VehiclesRepository): VehiclesService {
  return {
    list() {
      return vehicles.search({});
    },

    search(filters) {
      return vehicles.search(filters);
    },

    create(input) {
      return vehicles.create(input);
    },

    update(id, input) {
      return vehicles.update(id, input);
    },
  };
}
