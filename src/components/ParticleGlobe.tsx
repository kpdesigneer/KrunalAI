import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useScroll, useSpring } from 'framer-motion';

const vertexShader = `
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uProgress;
  uniform vec3 uRippleOrigin;
  uniform float uRippleTime;
  
  attribute float size;
  attribute vec3 targetPos1; // Box
  attribute vec3 targetPos2; // Helix
  
  varying vec3 vColor;
  varying float vDepth;
  varying float vTwinkle;
  varying float vHighlight;
  varying float vRim;
  
  void main() {
    float p1 = clamp(uProgress, 0.0, 1.0);
    float p2 = clamp(uProgress - 1.0, 0.0, 1.0);
    
    // Smooth easing
    p1 = smoothstep(0.0, 1.0, p1);
    p2 = smoothstep(0.0, 1.0, p2);

    vec3 pos = position; // Sphere
    pos = mix(pos, targetPos1, p1);
    pos = mix(pos, targetPos2, p2);
    
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
    
    // Dynamically hide 40% of particles during the globe phase (uProgress < 1.0)
    // As uProgress moves to 1.0 (Box), all particles become visible.
    float visibilitySeed = fract(size * 123.456);
    float globeFade = smoothstep(0.0, 1.0, uProgress);
    float visibility = mix(step(0.4, visibilitySeed), 1.0, globeFade);
    
    // Affected particles double in size, return to normal when cursor moves away
    // Multiplied by visibility to hide them during the globe phase
    gl_PointSize = (size * 3.0576 + vTwinkle * 2.436) * (20.0 / vDepth) * (1.0 + vHighlight * 3.0) * visibility;
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

  const particleCount = 9408; // Doubled again to 9408 particles for extreme density in the box state

  // Generate multi-shape geometry
  const { positions, posBox, posHelix, sizes } = useMemo(() => {
    const pSphere = new Float32Array(particleCount * 3);
    const pBox = new Float32Array(particleCount * 3);
    const pHelix = new Float32Array(particleCount * 3);
    const pointSizes = new Float32Array(particleCount);
    
    const radius = 2.5;

    for(let i = 0; i < particleCount; i++) {
      // 1. SPHERE
      const u = Math.random();
      const v = Math.random();
      const theta = u * 2.0 * Math.PI;
      const phi = Math.acos(2.0 * v - 1.0);
      // Eliminated inner volumetric scatter entirely—particles are now pulled perfectly tight against the exact circumference shell!
      // Pull particles perfectly tight to circumference
      const rNoise = radius * (0.9995 + Math.random() * 0.001);
      pSphere[i*3]   = Math.sin(phi) * Math.cos(theta) * rNoise;
      pSphere[i*3+1] = Math.sin(phi) * Math.sin(theta) * rNoise;
      pSphere[i*3+2] = Math.cos(phi) * rNoise;
      
      // 2. WIREFRAME BOX (Joining the Corners)
      const edgeIdx = Math.floor(Math.random() * 12);
      const boxSize = 1.6;
      const tEdge = (Math.random() - 0.5) * 2 * boxSize; // Position along the edge
      
      let bx, by, bz;
      // 12 Edges of a cube
      if (edgeIdx < 4) { // 4 edges along X
        bx = tEdge;
        by = (edgeIdx & 1) ? boxSize : -boxSize;
        bz = (edgeIdx & 2) ? boxSize : -boxSize;
      } else if (edgeIdx < 8) { // 4 edges along Y
        bx = (edgeIdx & 1) ? boxSize : -boxSize;
        by = tEdge;
        bz = (edgeIdx & 2) ? boxSize : -boxSize;
      } else { // 4 edges along Z
        bx = (edgeIdx & 1) ? boxSize : -boxSize;
        by = (edgeIdx & 2) ? boxSize : -boxSize;
        bz = tEdge;
      }
      
      const edgeNoise = 0.45; // Tripled from 0.15
      pBox[i*3]   = bx + (Math.random() - 0.5) * edgeNoise;
      pBox[i*3+1] = by + (Math.random() - 0.5) * edgeNoise;
      pBox[i*3+2] = bz + (Math.random() - 0.5) * edgeNoise;

      // 3. CHEVRONS (</>) - Tightened Strokes
      const group = i % 3;
      let cx, cy, cz = (Math.random() - 0.5) * 0.8; 
      const thickness = 0.15; // Tightened from chunky 0.8 state
      
      if (group === 0) { // <
        const t = Math.random();
        // Wider spread, shorter height for blunter angles
        cx = -1.5 + (t > 0.5 ? (t - 0.5) * 1.5 : (0.5 - t) * 1.5);
        cy = (t - 0.5) * 2.0; 
        cx -= 1.0; 
        cx += (Math.random() - 0.5) * thickness;
        cy += (Math.random() - 0.5) * thickness;
      } else if (group === 1) { // /
        const t = Math.random() - 0.5;
        cx = -t * 0.8;
        cy = t * 3.5; 
        cx += (Math.random() - 0.5) * thickness;
      } else { // >
        const t = Math.random();
        cx = 1.5 - (t > 0.5 ? (t - 0.5) * 1.5 : (0.5 - t) * 1.5);
        cy = (t - 0.5) * 2.0; 
        cx += 1.0; 
        cx += (Math.random() - 0.5) * thickness;
        cy += (Math.random() - 0.5) * thickness;
      }
      pHelix[i*3] = cx;
      pHelix[i*3+1] = cy;
      pHelix[i*3+2] = cz;

      pointSizes[i] = Math.random() * 1.5 + 0.5;
    }
    return { positions: pSphere, posBox: pBox, posHelix: pHelix, sizes: pointSizes };
  }, []);

  // Modern organic zoom-out entry using elastic damping
  const entryDuration = 6.0; 
  const targetScale = 0.8;

  useFrame((state) => {
    const s = smoothProgress.get();
    let prog;
    if (s < 0.4) {
      prog = s / 0.4; // Sphere to Box (0 to 1)
    } else if (s < 0.5) {
      prog = 1.0; // Hold Box
    } else if (s < 0.7) {
      prog = 1.0 + (s - 0.5) / 0.2; // Box to Chevrons (1 to 2)
    } else {
      prog = 2.0; // Hold Chevrons until end
    }
    
    const elapsed = state.clock.elapsedTime;

    // Movement & Scale Logic (Internalized for perfect mouse tracking)
    // Map scroll progress (0-0.3) to a horizontal shift of approx -3.2 units
    const sVal = s;
    const targetX = sVal < 0.3 ? (sVal / 0.3) * -3.2 : -3.2;
    const currentScale = targetScale;

    if (groupRef.current) {
      // Entry zoom effect
      let finalScale = currentScale;
      if (elapsed < entryDuration) {
        const t = elapsed;
        const decay = Math.exp(-1.8 * t);
        const oscillation = Math.cos(4.0 * t);
        const scaleMultiplier = 1.0 + (0.7 * decay * oscillation);
        finalScale *= scaleMultiplier;
      }
      
      groupRef.current.scale.set(finalScale, finalScale, finalScale);
      groupRef.current.position.x = targetX;
      groupRef.current.position.y = 0;
      
      // Counter-rotation to fix perspective distortion when on the left
      // As it moves to targetX (-3.2), rotate it by ~22 degrees (0.38 rad) 
      // so the front face stays parallel to the viewer.
      const rotationTarget = (sVal < 0.3 ? (sVal / 0.3) : 1) * 0.38;
      groupRef.current.rotation.y = rotationTarget;
    }

    if (shaderRef.current) {
      shaderRef.current.uniforms.uTime.value = elapsed;
      shaderRef.current.uniforms.uProgress.value = prog;
      
      // 3D mouse mapping
      const vector = new THREE.Vector3(state.mouse.x, state.mouse.y, 0.5);
      vector.unproject(state.camera);
      const dir = vector.sub(state.camera.position).normalize();
      const distance = -state.camera.position.z / dir.z;
      const pos = state.camera.position.clone().add(dir.multiplyScalar(distance));
      
      const currentMouse = shaderRef.current.uniforms.uMouse.value as THREE.Vector3;
      
      // CRITICAL FIX: Align mouse effect with the translated group
      const localPos = pos.clone();
      if (groupRef.current) {
        localPos.sub(groupRef.current.position).divide(groupRef.current.scale);
      }
      
      // Detect significant cursor movement to trigger ripple
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
