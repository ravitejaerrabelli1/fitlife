export type UnitSystem = "metric" | "imperial";

export const LB_PER_KG = 2.2046226218;
export const CM_PER_IN = 2.54;
export const KCAL_PER_KG_FAT = 7700;
export const KCAL_PER_LB_FAT = 3500;

export function lbToKg(lb: number): number {
  return lb / LB_PER_KG;
}

export function kgToLb(kg: number): number {
  return kg * LB_PER_KG;
}

export function inToCm(inches: number): number {
  return inches * CM_PER_IN;
}

export function cmToIn(cm: number): number {
  return cm / CM_PER_IN;
}

export function feetInchesToCm(feet: number, inches: number): number {
  return inToCm(feet * 12 + inches);
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToIn(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches - feet * 12);
  if (inches === 12) return { feet: feet + 1, inches: 0 };
  return { feet, inches };
}

export function ozToMl(oz: number): number {
  return oz * 29.5735;
}

export function mlToOz(ml: number): number {
  return ml / 29.5735;
}

export function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function formatWeight(kg: number, units: UnitSystem): string {
  return units === "metric"
    ? `${round(kg, 1)} kg`
    : `${round(kgToLb(kg), 1)} lb`;
}

export function formatHeight(cm: number, units: UnitSystem): string {
  if (units === "metric") return `${round(cm)} cm`;
  const { feet, inches } = cmToFeetInches(cm);
  return `${feet}' ${inches}"`;
}
