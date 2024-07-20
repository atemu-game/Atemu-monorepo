export * from './base.result';
export * from './base.queryparams';
export * from './base.result.pagination';

export const BURN_ADDRESS =
  '0x0000000000000000000000000000000000000000000000000000000000000000';

export type Attribute = {
  trait_type: string;
  value: any;
  display_type?: string;
};

export type AttributeMap = {
  label: string;
  trait_type: string;
  type: AttributesMapType;
  min?: number;
  max?: number;
  options?: string[];
};

export enum AttributesMapType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
}

export enum CardCollectionStandard {
  ERC721 = 'ERC-721',
  ERC1155 = 'ERC-1155',
}
