export type Vec3 = [number, number, number];

export function clamp(number: number, min: number, max: number) {
  return Math.max(min, Math.min(number, max));
}

export function vecAdd(a: Vec3, b: Vec3): Vec3 {
  const result = Array(3) as Vec3;
  for (let i = 0; i < 3; ++i) {
    result[i] = a[i] + b[i];
  }
  return result;
}
