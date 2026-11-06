export type Vec3 = [number, number, number];
export type Matrix3 = [Vec3, Vec3, Vec3];
export type Point = [number, number];
export type ShapeKind = 'Box' | 'Sphere' | 'Capsule' | 'Cylinder';

export type Footprint =
  | { circle: { center: Point; radius: number } }
  | { polygon: Point[] };

const CIRCLE_SEGMENTS = 32;

// Same convention as sead's Matrix34::makeR: the X rotation is applied first, then Y, then Z.
export function eulerRotation([x, y, z]: Vec3): Matrix3 {
  const [sx, sy, sz] = [Math.sin(x), Math.sin(y), Math.sin(z)];
  const [cx, cy, cz] = [Math.cos(x), Math.cos(y), Math.cos(z)];
  return [
    [cy * cz, sx * sy * cz - cx * sz, cx * sy * cz + sx * sz],
    [cy * sz, sx * sy * sz + cx * cz, cx * sy * sz - sx * cz],
    [-sy, sx * cy, cx * cy],
  ];
}

export function transform(rotation: Matrix3, origin: Vec3, local: Vec3): Vec3 {
  return rotation.map((row, i) => origin[i] + row[0] * local[0] + row[1] * local[1] + row[2] * local[2]) as Vec3;
}

function convexHull(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: Point, a: Point, b: Point) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const half = (input: Point[]) => {
    const result: Point[] = [];
    for (const point of input) {
      while (result.length >= 2 && cross(result[result.length - 2], result[result.length - 1], point) <= 0)
        result.pop();
      result.push(point);
    }
    result.pop();
    return result;
  };
  return [...half(sorted), ...half([...sorted].reverse())];
}

function ring(radius: number, y: number): Vec3[] {
  return Array.from({ length: CIRCLE_SEGMENTS }, (_, i) => {
    const angle = 2 * Math.PI * i / CIRCLE_SEGMENTS;
    return [radius * Math.cos(angle), y, radius * Math.sin(angle)] as Vec3;
  });
}

function hullOf(points: Vec3[]): Footprint {
  return { polygon: convexHull(points.map(p => [p[0], p[2]])) };
}

// The top-down (XZ) outline of a shape centred at `center`. Cylinders and capsules run along the local Y axis, with
// halfExtents[1] the half length of the axis and halfExtents[0] the radius; a capsule's caps add the radius at each end.
export function footprint(kind: ShapeKind, center: Vec3, halfExtents: Vec3, rotation: Matrix3): Footprint {
  if (kind == 'Box') {
    const corners: Vec3[] = [];
    for (const sx of [-1, 1]) {
      for (const sy of [-1, 1]) {
        for (const sz of [-1, 1])
          corners.push(transform(rotation, center, [sx * halfExtents[0], sy * halfExtents[1], sz * halfExtents[2]]));
      }
    }
    return hullOf(corners);
  }

  const radius = halfExtents[0];
  const axisIsVertical = Math.abs(rotation[1][1]) > 0.9999;
  if (kind == 'Sphere' || axisIsVertical)
    return { circle: { center: [center[0], center[2]], radius } };

  if (kind == 'Capsule') {
    const ends = [-1, 1].map(sign => transform(rotation, center, [0, sign * halfExtents[1], 0]));
    return hullOf(ends.flatMap(end => ring(radius, 0).map(p => [end[0] + p[0], 0, end[2] + p[2]] as Vec3)));
  }
  return hullOf([-1, 1].flatMap(sign => ring(radius, sign * halfExtents[1]).map(p => transform(rotation, center, p))));
}
