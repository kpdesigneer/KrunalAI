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
  attribute vec3 targetPos3; // Stars
  
  varying vec3 vColor;
  varying float vDepth;
  varying float vTwinkle;
  varying float vHighlight;
  varying float vRim;
  
  void main() {
    float p1 = clamp(uProgress, 0.0, 1.0);
    float p2 = clamp(uProgress - 1.0, 0.0, 1.0);
    float p3 = clamp(uProgress - 2.0, 0.0, 1.0);
    
    // Smooth easing
    p1 = smoothstep(0.0, 1.0, p1);
    p2 = smoothstep(0.0, 1.0, p2);
    p3 = smoothstep(0.0, 1.0, p3);

    vec3 pos = position; // Sphere
    pos = mix(pos, targetPos1, p1);
    pos = mix(pos, targetPos2, p2);
    pos = mix(pos, targetPos3, p3);
    
    // Rotate slowly on Y axis
    float angle = uTime * 0.05;
    mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
    pos.xz = rot * pos.xz;
    
    // Add fine ambient visual drift
    pos.x += sin(uTime * 0.8 + pos.y * 3.0) * 0.02;
    pos.y += cos(uTime * 1.0 + pos.z * 3.0) * 0.02;
    pos.z += sin(uTime * 0.9 + pos.x * 3.0) * 0.02;
    
    // 2D distance so the entire visible front repels uniformly
    float dist = distance(pos.xy, uMouse.xy);
    // Only repel front-facing particles (z > 0) — back particles stay untouched, no cylinder
    float frontFace = smoothstep(-0.2, 0.3, pos.z);
    
    // 2D depth tracking strictly stripped of all native parallax mathematical drop-off metrics
    // Buttery smooth structural pointer mapping! 
    // Wider interaction radius — more particles around the cursor are affected
    float radius = 1.2;
    float push = smoothstep(radius, 0.0, dist);
    
    // Smooth, visible bounce
    float bounce = push * (1.0 - push) * 0.08;
    
    // Subtle organic wake
    float wakeBounds = max(0.0, 1.0 - (dist / 2.5)); 
    float naturalRipple = sin(dist * 3.0 - uTime * 1.0 + (pos.x + pos.y) * 1.5) * 0.02 * wakeBounds;
    
    // Expanding ripple ring effect when cursor leaves an area
    float rippleAge = uTime - uRippleTime;
    float rippleDist = distance(pos.xy, uRippleOrigin.xy);
    float rippleRadius = rippleAge * 1.5; // ring expands outward
    float rippleWidth = 0.4;
    float rippleRing = smoothstep(rippleWidth, 0.0, abs(rippleDist - rippleRadius));
    float rippleFade = max(0.0, 1.0 - rippleAge * 0.8); // fades out over ~1.2 seconds
    float rippleForce = rippleRing * rippleFade * 0.15 * frontFace;
    
    // Combined force — hollow reduced by 50%
    float dynamicForce = (push + bounce + naturalRipple); 
    
    // Soft horizontal displacement direction
    vec3 dir = normalize(vec3(pos.x - uMouse.x, pos.y - uMouse.y, 0.0));
    
    // Reduced hollow force + ripple outward push
    pos += dir * dynamicForce * 0.2 * frontFace;
    
    // Calculate dynamic speed based on shape progress (faster in Box and Chevron)
    float speedFactor = 1.0 + clamp(uProgress, 0.0, 2.0) * 1.5;

    // Add organic random movement (drifting) - tightened to keep particles close to surface
    pos.x += sin(uTime * 0.4 * speedFactor + size * 100.0) * 0.05;
    pos.y += cos(uTime * 0.35 * speedFactor + size * 120.0) * 0.05;
    pos.z += sin(uTime * 0.45 * speedFactor + size * 80.0) * 0.05;

    // Add ripple displacement (pushes outward from ripple origin)
    vec3 rippleDir = normalize(vec3(pos.x - uRippleOrigin.x, pos.y - uRippleOrigin.y, 0.0));
    pos += rippleDir * rippleForce;
    
    // Assign highlight factor so fragment shader can specifically glow affected particles
    vHighlight = push;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    // Calculate a camera-facing Rim density constraint using model-view X/Y dispersion offsets
    vRim = smoothstep(0.0, 2.5, length(mvPosition.xy));
    
    // Retain z-depth variable to fade items in the fragment shader based on distance
    vDepth = -mvPosition.z;
    
    // Math to create a shimmering twinkle variation over time unique for sizes
    vTwinkle = (sin(uTime * 1.5 + size * 100.0) * 0.5 + 0.5);

    // Muted grey tones
    vColor = vec3(0.68, 0.68, 0.68);
    
    // Dynamically manage particle density across states:
    // TOTAL PARTICLES = 10,000
    // Globe: 27.5% (2750), Box: 50% (5000), Tetra: 22% (2200), Stars: 60% (6000)
    float visibilitySeed = fract(size * 123.456);
    float globeFade = smoothstep(0.0, 1.0, uProgress);
    float tetraFade = smoothstep(1.0, 2.0, uProgress);
    float starsFade = smoothstep(2.0, 3.0, uProgress);
    
    // Mix to Globe density (27.5% = step(0.725))
    float baseVisibility = mix(step(0.725, visibilitySeed), step(0.5, visibilitySeed), globeFade);
    // Mix to Tetra density (22% = step(0.78))
    baseVisibility = mix(baseVisibility, step(0.78, visibilitySeed), tetraFade);
    // Mix to Stars density (60% = step(0.4))
    float visibility = mix(baseVisibility, step(0.4, visibilitySeed), starsFade);
    
    // Size multiplier: 1.0 (Globe/Box) -> 1.5 (Tetra) -> 1.2 (Stars)
    float sizeMultiplier = mix(1.0, 1.5, tetraFade);
    sizeMultiplier = mix(sizeMultiplier, 1.2, starsFade);
    
    gl_PointSize = (size * 3.0576 + vTwinkle * 2.436) * (20.0 / vDepth) * (1.0 + vHighlight * 3.0) * visibility * sizeMultiplier;
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
    
    // Beautiful, soft inverse-distance glowing falloff natively mapping true atmospheric glowing halos onto all dots equally!
    // Creates a naturally dense bright core radiating softly outward gracefully into the perimeter flawlessly!
    float glow = max(0.0, (0.08 / r) - 0.16);
    
    // Parallax depth fade (distant particles get fainter to create true 3D atmosphere)
    float depthFade = clamp(1.0 - (vDepth - 5.0) / 10.0, 0.1, 1.0);
    
    // Shift color directly from solid White to a soft translucent Periwinkle/Purple!
    // This completely removes the sharp core, turning the whole dot into a pastel bubble.
    vec3 targetOrbColor = vec3(0.65, 0.65, 1.0);
    vec3 finalColor = mix(vColor, targetOrbColor, vHighlight);
    
    // Opacity calculation. Base alpha limits forcefully raised to ensure color saturation blocks background leaks!
    float baseAlpha = depthFade * (0.7 + vTwinkle * 0.3);
    
    // Native Camera-Facing Fresnel: Center faces limits pulled up to 50% opacity floor to keep center particles observably thickly white!
    float rimFade = mix(0.5, 1.0, vRim); 
    
    // Final active opacity algorithm algebraically reduced downwards by precisely another 20% globally!
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
  varying vec3 vNormal;
  void main() {
    // Smoother atmospheric falloff using a higher power for better central concentration
    float edge = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
    
    // Create a very soft, multi-layered falloff to eliminate sharp geometric boundaries
    float baseIntensity = pow(edge, 2.5); 
    float softEdge = smoothstep(0.0, 0.4, edge); // Forces a soft fade-to-zero at the very perimeter
    
    float intensity = baseIntensity * softEdge;
    
    // Light, pastel purple atmospheric glow with a more translucent, blurred feel
    gl_FragColor = vec4(0.35, 0.35, 0.85, intensity * 0.3); 
  }
`;

export function ParticleGlobe({ scrollY }: { scrollY: any }) {
  const shaderRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Track scrolling to morph shapes
  const smoothProgress = scrollY;

  const particleCount = 10000; // Increased to 10,000 to allow doubling the star density

  // Generate multi-shape geometry
  const { positions, posBox, posHelix, posStars, sizes } = useMemo(() => {
    const pSphere = new Float32Array(particleCount * 3);
    const pBox = new Float32Array(particleCount * 3);
    const pHelix = new Float32Array(particleCount * 3);
    const pStars = new Float32Array(particleCount * 3);
    const pointSizes = new Float32Array(particleCount);
    
    const radius = 2.5;

    // Tetrahedral Geometry Constants
    const sideSize = 1.8;
    const vertices = [
      [1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]
    ].map(v => v.map(c => c * sideSize * 0.8));
    const edges = [
      [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]
    ];

    for(let i = 0; i < particleCount; i++) {
      const u = Math.random();
      const v = Math.random();
      
      // 1. SPHERE
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      const rNoise = radius * (0.9995 + Math.random() * 0.001);
      pSphere[i*3]   = Math.sin(phi) * Math.cos(theta) * rNoise;
      pSphere[i*3+1] = Math.sin(phi) * Math.sin(theta) * rNoise;
      pSphere[i*3+2] = Math.cos(phi) * rNoise;
      
      // 2. WIREFRAME BOX
      const edgeIdxBox = Math.floor(Math.random() * 12);
      const boxSize = 1.44;
      const tEdge = (Math.random() - 0.5) * 2 * boxSize;
      let bx, by, bz;
      if (edgeIdxBox < 4) {
        bx = tEdge;
        by = (edgeIdxBox & 1) ? boxSize : -boxSize;
        bz = (edgeIdxBox & 2) ? boxSize : -boxSize;
      } else if (edgeIdxBox < 8) {
        bx = (edgeIdxBox & 1) ? boxSize : -boxSize;
        by = tEdge;
        bz = (edgeIdxBox & 2) ? boxSize : -boxSize;
      } else {
        bx = (edgeIdxBox & 1) ? boxSize : -boxSize;
        by = (edgeIdxBox & 2) ? boxSize : -boxSize;
        bz = tEdge;
      }
      const edgeNoise = 0.45;
      pBox[i*3]   = bx + (Math.random() - 0.5) * edgeNoise;
      pBox[i*3+1] = by + (Math.random() - 0.5) * edgeNoise;
      pBox[i*3+2] = bz + (Math.random() - 0.5) * edgeNoise;

      // 3. TETRAHEDRON
      const edgeIdxTetra = i % 6;
      const vA = vertices[edges[edgeIdxTetra][0]];
      const vB = vertices[edges[edgeIdxTetra][1]];
      const tLerp = Math.random();
      let tx = vA[0] + (vB[0] - vA[0]) * tLerp;
      let ty = vA[1] + (vB[1] - vA[1]) * tLerp;
      let tz = vA[2] + (vB[2] - vA[2]) * tLerp;
      const tetraThickness = 0.45;
      tx += (Math.random() - 0.5) * tetraThickness;
      ty += (Math.random() - 0.5) * tetraThickness;
      tz += (Math.random() - 0.5) * tetraThickness;
      pHelix[i*3] = tx;
      pHelix[i*3+1] = ty;
      pHelix[i*3+2] = tz;

      // 4. SPARKLE STARS
      const starGroup = i % 10;
      let sx, sy, sz = (Math.random() - 0.5) * 0.8;
      const tStar = Math.random() * Math.PI * 2;
      const rStar = 0.5 + Math.pow(Math.random(), 0.5) * 0.5; 
      const pStar = 2.5;
      const starX = Math.pow(Math.abs(Math.cos(tStar)), pStar) * Math.sign(Math.cos(tStar)) * rStar;
      const starY = Math.pow(Math.abs(Math.sin(tStar)), pStar) * Math.sign(Math.sin(tStar)) * rStar;
      if (starGroup < 6) {
        sx = starX * 1.6 - 1.0; sy = starY * 1.6;
      } else if (starGroup < 8) {
        sx = starX * 0.7 + 1.2; sy = starY * 0.7 + 1.0;
      } else {
        sx = starX * 0.55 + 1.4; sy = starY * 0.55 - 0.8;
      }
      pStars[i*3] = sx;
      pStars[i*3+1] = sy;
      pStars[i*3+2] = sz;

      pointSizes[i] = Math.random() * 1.5 + 0.5;
    }
    return { positions: pSphere, posBox: pBox, posHelix: pHelix, posStars: pStars, sizes: pointSizes };
  }, []);

  // Modern organic zoom-out entry using elastic damping
  const entryDuration = 6.0; 
  const targetScale = 0.8;

  useFrame((state) => {
    const elapsed = state.clock.elapsedTime;
    
    if (groupRef.current) {
      const sVal = smoothProgress.get();
      
      // RECALIBRATED TIMELINE (V4):
      // 0-20 (Globe-Box), 20-30 (Hold Box), 30-40 (Box-Tetra), 
      // 40-55 (Hold Tetra), 55-65 (Tetra-Stars), 65-90 (Hold Stars), 90+ (Exit)
      
      // Track horizontal target position:
      // 0-20: Center -> -2.5
      // 55-65: -2.5 -> +3.0
      let targetX;
      if (sVal < 0.2) {
        targetX = -2.5 * (sVal / 0.2);
      } else if (sVal < 0.55) {
        targetX = -2.5;
      } else if (sVal < 0.65) {
        targetX = -2.5 + (sVal - 0.55) / 0.1 * 5.5; 
      } else {
        targetX = 3.0;
      }
      
      // Entry zoom effect
      let finalScale = targetScale;
      if (elapsed < entryDuration) {
        const t = elapsed;
        const decay = Math.exp(-1.8 * t);
        const oscillation = Math.cos(4.0 * t);
        const scaleMultiplier = 1.0 + (0.7 * decay * oscillation);
        finalScale *= scaleMultiplier;
      }
      
      groupRef.current.scale.set(finalScale, finalScale, finalScale);
      groupRef.current.position.x = targetX;
      
      // Footer Exit: Start exit after the 90% stars hold point
      const exitY = sVal > 0.9 ? (sVal - 0.9) / 0.1 * 10.0 : 0;
      groupRef.current.position.y = exitY;
      
      // Rotation logic: Fade out completely as we move to Tetra (sVal > 0.3)
      const baseRotation = (sVal < 0.15 ? (sVal / 0.15) : 1) * 0.38;
      const rotationFade = sVal >= 0.4 ? 0.0 : (1.0 - Math.min(1.0, Math.max(0.0, (sVal - 0.3) / 0.1)));
      groupRef.current.rotation.y = baseRotation * rotationFade;
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      const sVal = smoothProgress.get();
      let prog;
      if (sVal < 0.3) {
        prog = sVal / 0.3; 
      } else if (sVal < 0.4) {
        prog = 1.0; 
      } else if (sVal < 0.5) {
        prog = 1.0 + (sVal - 0.4) / 0.1; 
      } else if (sVal < 0.65) {
        prog = 2.0;
      } else if (sVal < 0.75) {
        prog = 2.0 + (sVal - 0.65) / 0.1;
      } else {
        prog = 3.0; 
      }
      shaderRef.current.uniforms.uProgress.value = prog;
      
      // 3D mouse mapping
      const vector = new THREE.Vector3(state.mouse.x, state.mouse.y, 0.5);
      vector.unproject(state.camera);
      const dir = vector.sub(state.camera.position).normalize();
      const distance = -state.camera.position.z / dir.z;
      const pos = state.camera.position.clone().add(dir.multiplyScalar(distance));
      
      const currentMouse = shaderRef.current.uniforms.uMouse.value as THREE.Vector3;
      
      const localPos = pos.clone();
      if (groupRef.current) {
        localPos.sub(groupRef.current.position).divide(groupRef.current.scale);
      }
      
      const moveDist = currentMouse.distanceTo(localPos);
      if (moveDist > 0.15) {
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
          <bufferAttribute 
            attach="attributes-position" 
            count={positions.length / 3} 
            array={positions} 
            itemSize={3} 
          />
          <bufferAttribute 
            attach="attributes-targetPos1" 
            count={posBox.length / 3} 
            array={posBox} 
            itemSize={3} 
          />
          <bufferAttribute 
            attach="attributes-targetPos2" 
            count={posHelix.length / 3} 
            array={posHelix} 
            itemSize={3} 
          />
          <bufferAttribute 
            attach="attributes-targetPos3" 
            count={posStars.length / 3} 
            array={posStars} 
            itemSize={3} 
          />
          <bufferAttribute 
            attach="attributes-size" 
            count={sizes.length} 
            array={sizes} 
            itemSize={1} 
          />
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
          blending={THREE.NormalBlending} // Converted to NormalBlending exactly to assure independent dot coloring
        />
      </points>
      {/* Light Purple Inner Glow */}
      <mesh>
        <sphereGeometry args={[2.4, 32, 32]} />
        <shaderMaterial
          vertexShader={glowVertexShader}
          fragmentShader={glowFragmentShader}
          transparent={true}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}
