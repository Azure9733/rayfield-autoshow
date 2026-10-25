import { NotFoundError } from '../../lib/errors';
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
  remove(id: string): Promise<void>;
  purchase(id: string): Promise<Vehicle>;
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

    async update(id, input) {
      const updated = await vehicles.update(id, input);
      if (!updated) throw vehicleNotFound();
      return updated;
    },

    async remove(id) {
      if (!(await vehicles.remove(id))) throw vehicleNotFound();
    },

    async purchase(id) {
      return (await vehicles.purchaseOne(id))!;
    },
  };
}

function vehicleNotFound(): NotFoundError {
  return new NotFoundError('NOT_FOUND', 'Vehicle not found');
}
