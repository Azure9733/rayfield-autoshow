import { ConflictError, NotFoundError } from '../../lib/errors';
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
      const sold = await vehicles.purchaseOne(id);
      if (sold) return sold;
      // The atomic update can't say why it changed nothing; a follow-up lookup tells
      // "no such vehicle" (404) from "none left" (409).
      if (!(await vehicles.exists(id))) throw vehicleNotFound();
      throw new ConflictError('OUT_OF_STOCK', 'Out of stock');
    },
  };
}

function vehicleNotFound(): NotFoundError {
  return new NotFoundError('NOT_FOUND', 'Vehicle not found');
}
