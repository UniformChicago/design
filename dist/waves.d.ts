export interface WaveOptions {
  strands?: number;
  band?: number;
  spread?: number;
  center?: number;
  step?: number;
}
export interface Contour {
  points: [number, number][];
  alpha: number;
  width: number;
}
export declare const DEFAULTS: Required<WaveOptions>;
export declare function contours(width: number, height: number, t?: number, options?: WaveOptions): Contour[];
export declare function contoursSvg(
  width: number,
  height: number,
  options?: WaveOptions & { t?: number; signal: string; lake: string; opacity?: number },
): string;
/** contours/contoursSvg throw RangeError for out-of-range sizes or options (step must be at least 1) and TypeError for non-hex colors. */
/** Mounts the animated Atmosphere on a canvas; returns a function that stops it. */
export declare function mountAtmosphere(canvas: HTMLCanvasElement | null | undefined): () => void;
