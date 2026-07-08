import 'react';

/** drei's <Effects> extends ShaderPass at runtime; register it for TSX. */
declare module '@react-three/fiber' {
  interface ThreeElements {
    shaderPass: any;
  }
}
