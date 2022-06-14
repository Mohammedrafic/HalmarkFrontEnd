export enum OrderType {
  ContractToPerm,
  OpenPerDiem,
  PermPlacement,
  Traveler
}

export const OrderTypeOptions = [
  { id: OrderType.ContractToPerm, name: 'Contract To Perm' },
  { id: OrderType.OpenPerDiem, name: 'Open Per Diem' },
  { id: OrderType.PermPlacement, name: 'Perm. Placement' },
  { id: OrderType.Traveler, name: 'Traveler' }
];
