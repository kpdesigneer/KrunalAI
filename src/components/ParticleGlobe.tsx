import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const vertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uProgress;
  uniform vec3 uRippleOrigin;
  uniform float uRippleTime;
  
  attribute float size;
  attribute vec3 targetPos1; // Box
  attribute vec3 targetPos2; // Tetra
  attribute vec3 targetPos3; // Bulb
  attribute vec3 targetPos4; // Stars
  attribute vec3 targetPos5; // Play Button
  
  varying vec3 vColor;
  varying float vDepth;
  varying float vTwinkle;
  varying float vHighlight;
  varying float vRim;
  
  void main() {
    float p1 = clamp(uProgress, 0.0, 1.0);
    float p2 = clamp(uProgress - 1.0, 0.0, 1.0);
    float p3 = clamp(uProgress - 2.0, 0.0, 1.0);
    float p4 = clamp(uProgress - 3.0, 0.0, 1.0);
    float p5 = clamp(uProgress - 4.0, 0.0, 1.0);
    
    // Smooth easing
    p1 = smoothstep(0.0, 1.0, p1);
    p2 = smoothstep(0.0, 1.0, p2);
    p3 = smoothstep(0.0, 1.0, p3);
    p4 = smoothstep(0.0, 1.0, p4);
    p5 = smoothstep(0.0, 1.0, p5);

    vec3 pos = position; // Sphere
    pos = mix(pos, targetPos1, p1);
    pos = mix(pos, targetPos2, p2);
    pos = mix(pos, targetPos3, p3);
    pos = mix(pos, targetPos4, p4);
    pos = mix(pos, targetPos5, p5);
    
    // Rotate for Globe, Box, Triangle, and Bulb
    // Fade out before Stars (3.2 -> 4.0)
    float rotationFade = smoothstep(4.0, 3.2, uProgress);
    
    float angle = uTime * 0.05 * rotationFade;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xz = rot * pos.xz;
    
    // Add fine ambient visual drift
    pos.x += sin(uTime * 0.8 + pos.y * 3.0) * 0.02;
    pos.y += cos(uTime * 1.0 + pos.z * 3.0) * 0.02;
    pos.z += sin(uTime * 0.9 + pos.x * 3.0) * 0.02;
    
    // 2D distance so the entire visible front repels uniformly
    float dist = distance(pos.xy, uMouse.xy);
    float frontFace = smoothstep(-0.2, 0.3, pos.z);
    
    // 1.4 radius, 0.7x repel
    float radius = 1.4;
    float push = smoothstep(radius, 0.0, dist);
    float bounce = push * (1.0 - push) * 0.08;
    float wakeBounds = max(0.0, 1.0 - (dist / 2.5)); 
    float naturalRipple = sin(dist * 3.0 - uTime * 1.0 + (pos.x + pos.y) * 1.5) * 0.01 * wakeBounds;
    
    float rippleAge = uTime - uRippleTime;
    float rippleDist = distance(pos.xy, uRippleOrigin.xy);
    float rippleRadius = rippleAge * 1.5; 
    float rippleWidth = 0.4;
    float rippleRing = smoothstep(rippleWidth, 0.0, abs(rippleDist - rippleRadius));
    float rippleFade = max(0.0, 1.0 - rippleAge * 0.8); 
    float rippleForce = rippleRing * rippleFade * 0.075 * frontFace;
    
    float dynamicForce = (push + bounce + naturalRipple); 
    vec3 dir = normalize(vec3(pos.x - uMouse.x, pos.y - uMouse.y, 0.0));
    float repelReduction = mix(1.5, 1.0, clamp(uProgress, 0.0, 1.0));
    float glowReduction = mix(0.6, 0.3, clamp(uProgress, 0.0, 1.0));
    
    float isNotSphere = clamp(uProgress, 0.0, 1.0);
    float hollowFactor = mix(1.0, smoothstep(0.0, radius * 0.4, dist), isNotSphere);
    
    // Increased repel for non-sphere shapes
    pos += dir * dynamicForce * 0.2 * frontFace * repelReduction;
    pos.z -= (1.0 - hollowFactor) * 0.4 * frontFace; // Hollow depth push
    
    float speedFactor = 1.0 + clamp(uProgress, 0.0, 2.0) * 1.5;
    float jitterTime = uTime * 2.0;
    pos.x += sin(jitterTime + size * 43758.5453) * 0.04;
    pos.y += cos(jitterTime + size * 12345.6789) * 0.04;
    pos.z += sin(jitterTime + size * 98765.4321) * 0.04;
 
    vec3 rippleDir = normalize(vec3(pos.x - uRippleOrigin.x, pos.y - uRippleOrigin.y, 0.0));
    pos += rippleDir * rippleForce * repelReduction;
    
    vHighlight = push * glowReduction * hollowFactor;
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    vRim = smoothstep(0.0, 2.5, length(mvPosition.xy));
    vDepth = -mvPosition.z;
    vTwinkle = (sin(uTime * 1.5 + size * 100.0) * 0.5 + 0.5);
    vColor = mix(vec3(0.6), vec3(1.0), frontFace);
    
    float visibilitySeed = fract(size * 123.456);
    float f1 = clamp(uProgress, 0.0, 1.0);
    float f2 = clamp(uProgress - 1.0, 0.0, 1.0);
    float f3 = clamp(uProgress - 2.0, 0.0, 1.0);
    float f4 = clamp(uProgress - 3.0, 0.0, 1.0);
    float f5 = clamp(uProgress - 4.0, 0.0, 1.0);
    
    float baseVisibility = mix(step(0.725, visibilitySeed), step(0.6, visibilitySeed), f1);
    baseVisibility = mix(baseVisibility, step(0.82, visibilitySeed), f2);
    baseVisibility = mix(baseVisibility, step(0.8, visibilitySeed), f3);
    baseVisibility = mix(baseVisibility, step(0.85, visibilitySeed), f4);
    float visibility = mix(baseVisibility, step(0.86, visibilitySeed), f5);
    
    float sizeMultiplier = 3.0; 
    
    gl_PointSize = (1.3 * 3.0576 + vTwinkle * 2.436) * (20.0 / vDepth) * (1.0 + vHighlight * 3.0) * visibility * sizeMultiplier;
  }
`;

const fragmentShader = `
  varying vec3 vColor;
  varying float vDepth;
  varying float vTwinkle;
  varying float vHighlight;
  varying float vRim;
  
  void main() {
    float r = distance(gl_PointCoord, vec2(0.5));
    if (r > 0.5) discard;
    float glow = max(0.0, (0.04 / (r + 0.01)) - 0.1);
    float depthFade = clamp(1.0 - (vDepth - 5.0) / 10.0, 0.1, 1.0);
    vec3 targetOrbColor = vec3(0.65, 0.65, 1.0);
    vec3 finalColor = mix(vColor, targetOrbColor, vHighlight);
    float baseAlpha = depthFade * (0.7 + vTwinkle * 0.3);
    float rimFade = mix(0.5, 1.0, vRim); 
    float finalAlpha = mix(baseAlpha * rimFade, 0.75, vHighlight) * glow * 1.28; 
    gl_FragColor = vec4(finalColor, finalAlpha);
  }
`;

const glowVertexShader = `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const glowFragmentShader = `
  uniform float uGlowProgress;
  varying vec3 vNormal;
  void main() {
    float edge = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    float intensity = pow(edge, 2.5); // Bright core, soft surface fade
    // Mix between bright sphere (0.30) and refined shapes (0.12)
    float op = mix(0.12, 0.30, uGlowProgress);
    gl_FragColor = vec4(0.4, 0.4, 1.0, intensity * op); 
  }
`;

export function ParticleGlobe({ scrollY }: { scrollY: any }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const smoothProgress = scrollY;
  const particleCount = 10000;
  const progressVel = useRef(0); 

  const { positions, posBox, posHelix, posBulb, posStars, posWand, sizes } = useMemo(() => {
    const pSphere = new Float32Array(particleCount * 3);
    const pBox = new Float32Array(particleCount * 3);
    const pHelix = new Float32Array(particleCount * 3);
    const pStars = new Float32Array(particleCount * 3);
    const pBulb = new Float32Array(particleCount * 3);
    const pWand = new Float32Array(particleCount * 3);
    const pointSizes = new Float32Array(particleCount);
    
    const radius = 2.5;
    const sideSize = 1.8;
    const angleZ = 10 * (Math.PI / 180);
    const cosZ = Math.cos(angleZ);
    const sinZ = Math.sin(angleZ);
    
    const vertices = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(v => {
      const scaled = v.map(c => c * sideSize * 0.8);
      const rx = scaled[0] * cosZ - scaled[1] * sinZ;
      const ry = scaled[0] * sinZ + scaled[1] * cosZ;
      return [rx, ry, scaled[2]];
    });
    const edges = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

    for(let i = 0; i < particleCount; i++) {
      // 1. SPHERE
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const rNoise = radius * (0.9995 + Math.random() * 0.001);
      pSphere[i*3]   = Math.sin(phi) * Math.cos(theta) * rNoise;
      pSphere[i*3+1] = Math.sin(phi) * Math.sin(theta) * rNoise;
      pSphere[i*3+2] = Math.cos(phi) * rNoise;
      
      // 2. BOX
      const edgeIdxBox = Math.floor(Math.random() * 12);
      const bSize = 1.44;
      const tE = (Math.random() - 0.5) * 2 * bSize;
      let bx, by, bz;
      if (edgeIdxBox < 4) {
        bx = tE; by = (edgeIdxBox & 1) ? bSize : -bSize; bz = (edgeIdxBox & 2) ? bSize : -bSize;
      } else if (edgeIdxBox < 8) {
        bx = (edgeIdxBox & 1) ? bSize : -bSize; by = tE; bz = (edgeIdxBox & 2) ? bSize : -bSize;
      } else {
        bx = (edgeIdxBox & 1) ? bSize : -bSize; by = (edgeIdxBox & 2) ? bSize : -bSize; bz = tE;
      }
      pBox[i*3]   = bx + (Math.random() - 0.5) * 0.42;
      pBox[i*3+1] = by + (Math.random() - 0.5) * 0.42;
      pBox[i*3+2] = bz + (Math.random() - 0.5) * 0.42;

      // 3. TETRA
      const eIdxT = i % 6;
      const vA = vertices[edges[eIdxT][0]];
      const vB = vertices[edges[eIdxT][1]];
      const tL = Math.random();
      pHelix[i*3]   = (vA[0] + (vB[0] - vA[0]) * tL) + (Math.random() - 0.5) * 0.30;
      pHelix[i*3+1] = (vA[1] + (vB[1] - vA[1]) * tL) + (Math.random() - 0.5) * 0.30;
      pHelix[i*3+2] = (vA[2] + (vB[2] - vA[2]) * tL) + (Math.random() - 0.5) * 0.30;

      // 4. BULB (Reference-Matched)
      const bType = Math.random();
      let blbX, blbY, blbZ;
      if (bType < 0.75) {
        // Glass Part (Spherical top + tapering neck)
        const ang = Math.random() * Math.PI * 2;
        const vv = Math.random();
        const ph = Math.acos(2.0 * vv - 1.0);
        const rr = 1.15 + (Math.random() - 0.5) * 0.05;
        let x_ = Math.sin(ph) * Math.cos(ang) * rr;
        let y_ = Math.sin(ph) * Math.sin(ang) * rr; // Centered
        let z_ = Math.cos(ph) * rr;
        
        // Smoother, deeper join between top sphere and base neck
        if (y_ < 0.2) {
          const taper = Math.max(0, Math.min(1, (y_ + 1.2) / 1.65));
          x_ *= (0.35 + 0.65 * taper);
          z_ *= (0.35 + 0.65 * taper);
        }
        blbX = x_; blbY = y_; blbZ = z_;
      } else if (bType < 0.95) {
        // Base Bands (Two horizontal segments)
        const ang = Math.random() * Math.PI * 2;
        const r = 0.45 + (Math.random() - 0.5) * 0.02;
        const segment = Math.random();
        let h;
        if (segment < 0.5) h = -1.25 - Math.random() * 0.15; // Band 1 (Lowered to match center)
        else h = -1.5 - Math.random() * 0.15; // Band 2
        blbX = Math.cos(ang) * r;
        blbY = h;
        blbZ = Math.sin(ang) * r;
      } else {
        // Bottom Contact (Rounded Tip)
        const ang = Math.random() * Math.PI * 2;
        const vv = Math.random();
        const ph = Math.acos(2.0 * vv - 1.0);
        const rr = 0.25 * Math.random();
        blbX = Math.sin(ph) * Math.cos(ang) * rr;
        blbY = -1.75 - Math.abs(Math.cos(ph)) * 0.2;
        blbZ = Math.sin(ph) * Math.sin(ang) * rr;
      }
      pBulb[i*3] = blbX * 1.6; pBulb[i*3+1] = blbY * 1.6; pBulb[i*3+2] = blbZ * 1.6;

      // 5. STARS
      const sGrp = i % 10;
      const tS = Math.random() * Math.PI * 2;
      const rS = 0.5 + Math.pow(Math.random(), 0.5) * 0.5; 
      const pS = 2.5;
      const sX = Math.pow(Math.abs(Math.cos(tS)), pS) * Math.sign(Math.cos(tS)) * rS;
      const sY = Math.pow(Math.abs(Math.sin(tS)), pS) * Math.sign(Math.sin(tS)) * rS;
      let sx, sy, sz = (Math.random() - 0.5) * 0.3;
      if (sGrp < 6) { sx = sX * 1.6; sy = sY * 1.6; } // Removed -1.0 offset
      else if (sGrp < 8) { sx = sX * 0.7 + 1.2; sy = sY * 0.7 + 1.0; }
      else { sx = sX * 0.55 + 1.4; sy = sY * 0.55 - 0.8; }
      pStars[i*3] = sx - 0.5; pStars[i*3+1] = sy - 0.2; pStars[i*3+2] = sz; // Global centering

      // 6. CIRCULAR PLAY BUTTON (Hollow Triangle Cutout)
      let px, py, pz;
      const uC = Math.random();
      const vC = Math.random();
      const rC = Math.sqrt(uC) * 1.6;
      const thetaC = vC * Math.PI * 2;
      const depth = 0.9;
      
      let tx = Math.cos(thetaC) * rC;
      let ty = Math.sin(thetaC) * rC;
      
      // Rejection sampling to create the hollow triangle
      // Triangle: A(0.8, 0), B(-0.4, 0.6), C(-0.4, -0.6)
      let attempts = 0;
      while (tx >= -0.4 && tx <= 0.8 && Math.abs(ty) <= 0.5 * (0.8 - tx) && attempts < 10) {
        const uNew = Math.random();
        const vNew = Math.random();
        const rNew = Math.sqrt(uNew) * 1.6;
        const thetaNew = vNew * Math.PI * 2;
        tx = Math.cos(thetaNew) * rNew;
        ty = Math.sin(thetaNew) * rNew;
        attempts++;
      }
      
      px = tx;
      py = ty;
      pz = (Math.random() - 0.5) * depth;
      
      pWand[i*3] = px * 1.2; pWand[i*3+1] = py * 1.2; pWand[i*3+2] = pz;

      pointSizes[i] = Math.random() * 1.5 + 0.5;
    }
    return { positions: pSphere, posBox: pBox, posHelix: pHelix, posBulb: pBulb, posStars: pStars, posWand: pWand, sizes: pointSizes };
  }, []);

  const entryDuration = 6.0; 
  const targetScale = 0.8;

  useFrame((state, delta) => {
    const elapsed = state.clock.elapsedTime;
    if (groupRef.current) {
      const sVal = smoothProgress.get();
      let tx = 0, ty = 0, tz = 0;
      if (sVal < 0.05) { 
        const t = sVal / 0.05;
        tx = 0 * (1 - t) + -2.5 * t; 
        ty = 0; tz = 0;
      }
      else if (sVal < 0.25) { tx = -2.5; ty = 0.0; tz = 0.0; } 
      else if (sVal < 0.30) { 
        tx = -2.5; ty = 0.0; tz = 0.0; 
      }
      else if (sVal < 0.50) { tx = -2.5; ty = 0.0; tz = 0.0; } 
      else if (sVal < 0.55) { 
        tx = -2.5; ty = 0.0; tz = 0.0; 
      }
      else if (sVal < 0.75) { tx = -2.5; ty = 0.0; tz = 0.0; } 
      else if (sVal < 0.80) { 
        const t = (sVal - 0.75) / 0.05;
        tx = -2.5 * (1 - t) + 3.0 * t; 
        ty = 0.0; tz = 0.0;
      }
      else { tx = 3.0; ty = 0.0; tz = 0.0; }
      
      let finalScale = targetScale;
      if (elapsed < entryDuration) {
        const t = elapsed;
        finalScale *= (1.0 + (0.7 * Math.exp(-1.8 * t) * Math.cos(4.0 * t)));
      }
      groupRef.current.scale.set(finalScale, finalScale, finalScale);
      groupRef.current.position.set(tx, ty, tz);
      const baseRotation = (sVal < 0.05 ? (sVal / 0.05) : 1) * 0.38;
      const rotationFade = sVal >= 0.05 ? 0.0 : 1.0;
      groupRef.current.rotation.y = baseRotation * rotationFade;

      if (glowRef.current) {
        const t = Math.max(0, Math.min(1, sVal / 0.05));
        const glowScale = 1.05 * (1 - t) + 1.5 * t;
        glowRef.current.scale.set(glowScale, glowScale, glowScale);
        
        const glowMat = glowRef.current.material as THREE.ShaderMaterial;
        if (glowMat.uniforms.uGlowProgress) {
          glowMat.uniforms.uGlowProgress.value = 1.0 - t; 
        }
      }
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      const sVal = smoothProgress.get();
      let prog;
      if (sVal < 0.05) prog = sVal / 0.05;
      else if (sVal < 0.25) prog = 1.0;
      else if (sVal < 0.30) prog = 1.0 + (sVal - 0.25) / 0.05;
      else if (sVal < 0.50) prog = 2.0;
      else if (sVal < 0.55) prog = 2.0 + (sVal - 0.50) / 0.05;
      else if (sVal < 0.75) prog = 3.0;
      else if (sVal < 0.80) prog = 3.0 + (sVal - 0.75) / 0.05; // Quick Stars -> Play
      else prog = 5.0;
      // Refined Elastic-Snap Spring Morph Logic
      const stiffness = 100.0;
      const damping = 7.0;
      const dt = Math.min(delta, 0.1); 
      
      const currentP = shaderRef.current.uniforms.uProgress.value;
      const force = (prog - currentP) * stiffness;
      progressVel.current += (force - progressVel.current * damping) * dt;
      shaderRef.current.uniforms.uProgress.value += progressVel.current * dt;
      
      const vector = new THREE.Vector3(state.mouse.x, state.mouse.y, 0.5);
      vector.unproject(state.camera);
      const dir = vector.sub(state.camera.position).normalize();
      const dist = -state.camera.position.z / dir.z;
      const pos = state.camera.position.clone().add(dir.multiplyScalar(dist));
      const currentMouse = shaderRef.current.uniforms.uMouse.value as THREE.Vector3;
      const localPos = pos.clone();
      if (groupRef.current) localPos.sub(groupRef.current.position).divide(groupRef.current.scale);
      if (currentMouse.distanceTo(localPos) > 0.15) {
        shaderRef.current.uniforms.uRippleOrigin.value.copy(currentMouse);
        shaderRef.current.uniforms.uRippleTime.value = elapsed;
      }
      currentMouse.lerp(localPos, 0.2);
    }
  });

  return (
    <group ref={groupRef}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={positions.length / 3} array={positions} itemSize={3} />
          <bufferAttribute attach="attributes-targetPos1" count={posBox.length / 3} array={posBox} itemSize={3} />
          <bufferAttribute attach="attributes-targetPos2" count={posHelix.length / 3} array={posHelix} itemSize={3} />
          <bufferAttribute attach="attributes-targetPos3" count={posBulb.length / 3} array={posBulb} itemSize={3} />
          <bufferAttribute attach="attributes-targetPos4" count={posStars.length / 3} array={posStars} itemSize={3} />
          <bufferAttribute attach="attributes-targetPos5" count={posWand.length / 3} array={posWand} itemSize={3} />
          <bufferAttribute attach="attributes-size" count={sizes.length} array={sizes} itemSize={1} />
        </bufferGeometry>
        <shaderMaterial
          ref={shaderRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={{
            uTime: { value: 0 },
            uMouse: { value: new THREE.Vector3(999, 999, 999) },
            uProgress: { value: 0 },
            uRippleOrigin: { value: new THREE.Vector3(999, 999, 999) },
            uRippleTime: { value: -10 }
          }}
          transparent={true}
          depthWrite={false}
          blending={THREE.NormalBlending}
        />
      </points>
      <mesh ref={glowRef}>
        <sphereGeometry args={[2.4, 32, 32]} />
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          uniforms={{
            uGlowProgress: { value: 1.0 }
          }}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
