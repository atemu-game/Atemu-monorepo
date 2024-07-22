import { AttributesMapType } from '../types';

export * from './bigNumberishToText';
export * from './encode';
export * from './formatContractAddress';
export * from './validateFormat';

export const typeOfVal = (val: any): AttributesMapType => {
  if (val === true || val === false) return AttributesMapType.Boolean;
  if (String(val) === '[object Object]') return AttributesMapType.Object;
  if (Number(val) === val) return AttributesMapType.Number;
  return AttributesMapType.String;
};
