import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { Compass, RotateCcw, ZoomIn, ZoomOut, ArrowUp } from 'lucide-react';

export default function ThreeDViewer({ 
  sceneImage, 
  hotspots = [], 
  onAddHotspot, 
  onNavigate, 
  isEditorMode = false,
  previewHotspot = null,
  autoRotate = false,
  isLoggedIn = true
}) {
  const containerRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const threeSceneRef = useRef(null);
  const [sphereMesh, setSphereMesh] = useState(null);
  
  // Camera angles using refs for smooth performance (prevents React re-renders at 60fps)
  const lonRef = useRef(0);
  const latRef = useRef(0);
  
  // States for react UI elements
  const [zoom, setZoom] = useState(75); // Field of View (FOV)
  const [compassAngle, setCompassAngle] = useState(0);
  const [projectedHotspots, setProjectedHotspots] = useState([]);
  const [projectedPreviewHotspot, setProjectedPreviewHotspot] = useState(null);

  // References for drag handling
  const isUserInteracting = useRef(false);
  const onPointerDownMouseX = useRef(0);
  const onPointerDownMouseY = useRef(0);
  const onPointerDownLon = useRef(0);
  const onPointerDownLat = useRef(0);

  // Handle resizing and initial WebGL setup (runs once on mount)
  useEffect(() => {
    if (!containerRef.current) return;
    
    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;
    
    // 1. Scene setup
    const scene = new THREE.Scene();
    threeSceneRef.current = scene;
    
    // 2. Camera setup
    const camera = new THREE.PerspectiveCamera(zoom, width / height, 1, 1100);
    camera.target = new THREE.Vector3(0, 0, 0);
    cameraRef.current = camera;
    
    // 3. Geometry (Inverted Sphere)
    const geometry = new THREE.SphereGeometry(500, 60, 40);
    geometry.scale(-1, 1, 1); // Invert sphere geometry to look inside
    
    // 4. Material and texture loading (load initial texture asynchronously)
    const material = new THREE.MeshBasicMaterial({ color: 0x111111 }); // Dark placeholder color
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);
    setSphereMesh(sphere);
    
    const textureLoader = new THREE.TextureLoader();
    textureLoader.load(
      sceneImage,
      (loadedTexture) => {
        loadedTexture.colorSpace = THREE.SRGBColorSpace;
        material.map = loadedTexture;
        material.color.setHex(0xffffff); // Restore full color once loaded
        material.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.error("Error al cargar la textura inicial en ThreeDViewer:", err);
      }
    );
    
    // 5. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rendererRef.current = renderer;
    
    // Clear out old canvas
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    
    // Handle window resize
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      texture.dispose();
    };
  }, []); // Only run once on mount

  // Update texture when sceneImage changes instantly
  useEffect(() => {
    if (!sphereMesh) return;
    
    let isActive = true;
    const textureLoader = new THREE.TextureLoader();
    
    textureLoader.load(
      sceneImage, 
      (newTexture) => {
        if (!isActive) {
          newTexture.dispose();
          return;
        }
        newTexture.colorSpace = THREE.SRGBColorSpace;
        
        // Clean up old texture
        if (sphereMesh.material.map) {
          sphereMesh.material.map.dispose();
        }
        
        sphereMesh.material.map = newTexture;
        sphereMesh.material.needsUpdate = true;
      },
      undefined,
      (err) => {
        console.error("Error loading texture:", err);
      }
    );

    return () => {
      isActive = false;
    };
  }, [sceneImage, sphereMesh]);

  // Handle FOV changes
  useEffect(() => {
    if (cameraRef.current) {
      cameraRef.current.fov = zoom;
      cameraRef.current.updateProjectionMatrix();
    }
  }, [zoom]);

  // Main animation/render loop (runs at 60fps)
  useEffect(() => {
    let animationFrameId;
    
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      
      // Auto rotate logic
      if (autoRotate && !isUserInteracting.current) {
        lonRef.current += 0.08; // slow horizontal spin
      }
      
      updateCamera();
    };
    
    const updateCamera = () => {
      if (!cameraRef.current || !rendererRef.current || !threeSceneRef.current) return;
      
      // Keep Lat within bounds (-85 to 85 degrees to avoid gimbal lock)
      const safeLat = Math.max(-85, Math.min(85, latRef.current));
      
      const phi = THREE.MathUtils.degToRad(90 - safeLat);
      const theta = THREE.MathUtils.degToRad(lonRef.current);
      
      const target = new THREE.Vector3();
      target.x = 500 * Math.sin(phi) * Math.sin(theta);
      target.y = 500 * Math.cos(phi);
      target.z = 500 * Math.sin(phi) * Math.cos(theta);
      
      cameraRef.current.lookAt(target);
      rendererRef.current.render(threeSceneRef.current, cameraRef.current);
      
      // Update compass Heading (normalized 0-359 degrees)
      const currentHeading = Math.round((lonRef.current % 360 + 360) % 360);
      setCompassAngle(currentHeading);
      
      // Project hotspots
      projectHotspotsToScreen();
    };

    const projectHotspotsToScreen = () => {
      if (!cameraRef.current || !containerRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      const camera = cameraRef.current;
      
      // Project normal hotspots
      const projected = hotspots.map(h => {
        const pos = new THREE.Vector3(h.x, h.y, h.z);
        pos.project(camera);
        const isBehind = pos.z > 1;
        const left = (pos.x * 0.5 + 0.5) * width;
        const top = (-pos.y * 0.5 + 0.5) * height;
        
        return {
          ...h,
          left,
          top,
          visible: !isBehind && left >= 0 && left <= width && top >= 0 && top <= height
        };
      });
      setProjectedHotspots(projected);

      // Project preview hotspot
      if (previewHotspot) {
        const pos = new THREE.Vector3(previewHotspot.x, previewHotspot.y, previewHotspot.z);
        pos.project(camera);
        const isBehind = pos.z > 1;
        const left = (pos.x * 0.5 + 0.5) * width;
        const top = (-pos.y * 0.5 + 0.5) * height;
        
        setProjectedPreviewHotspot({
          ...previewHotspot,
          left,
          top,
          visible: !isBehind && left >= 0 && left <= width && top >= 0 && top <= height
        });
      } else {
        setProjectedPreviewHotspot(null);
      }
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [hotspots, previewHotspot, autoRotate]);

  // Drag interaction events
  const handlePointerDown = (e) => {
    isUserInteracting.current = true;
    
    onPointerDownMouseX.current = e.clientX;
    onPointerDownMouseY.current = e.clientY;
    
    onPointerDownLon.current = lonRef.current;
    onPointerDownLat.current = latRef.current;
  };

  const handlePointerMove = (e) => {
    if (!isUserInteracting.current) return;
    
    const deltaX = e.clientX - onPointerDownMouseX.current;
    const deltaY = e.clientY - onPointerDownMouseY.current;
    
    const sensitivity = zoom / 500;
    
    lonRef.current = onPointerDownLon.current - deltaX * sensitivity;
    latRef.current = onPointerDownLat.current + deltaY * sensitivity;
  };

  const handlePointerUp = (e) => {
    isUserInteracting.current = false;
    
    if (isEditorMode && onAddHotspot) {
      const clickDeltaX = Math.abs(e.clientX - onPointerDownMouseX.current);
      const clickDeltaY = Math.abs(e.clientY - onPointerDownMouseY.current);
      
      if (clickDeltaX < 3 && clickDeltaY < 3) {
        handleCanvasClick(e);
      }
    }
  };

  // Convert click to 3D point on the sphere
  const handleCanvasClick = (e) => {
    if (!containerRef.current || !cameraRef.current || !sphereMesh) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / containerRef.current.clientWidth) * 2 - 1;
    const y = -((e.clientY - rect.top) / containerRef.current.clientHeight) * 2 + 1;
    
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), cameraRef.current);
    
    const intersects = raycaster.intersectObjects([sphereMesh]);
    if (intersects.length > 0) {
      const intersectPoint = intersects[0].point;
      const normalizedPoint = intersectPoint.normalize().multiplyScalar(450); // sphere radius scale
      
      onAddHotspot({
        x: normalizedPoint.x,
        y: normalizedPoint.y,
        z: normalizedPoint.z
      });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* 3D Canvas Container */}
      <div 
        ref={containerRef} 
        className="viewer-canvas-container"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      />

      {/* HTML Overlay for Preview Hotspot */}
      {projectedPreviewHotspot && projectedPreviewHotspot.visible && (
        <div 
          className="hotspot-element"
          style={{ 
            left: `${projectedPreviewHotspot.left}px`, 
            top: `${projectedPreviewHotspot.top}px`,
            pointerEvents: 'none'
          }}
        >
          <div className="hotspot-ring-preview">
            <ArrowUp size={20} />
          </div>
          <div className="hotspot-label" style={{ borderStyle: 'dashed', borderColor: 'var(--primary)' }}>
            {projectedPreviewHotspot.title} (Prevista)
          </div>
        </div>
      )}

      {/* HTML Overlay for Hotspots */}
      {projectedHotspots.map((h, i) => h.visible && (
        <div 
          key={h.id || i}
          className="hotspot-element"
          style={{ 
            left: `${h.left}px`, 
            top: `${h.top}px` 
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (isEditorMode) {
              // Highlight or select inside editor
            } else if (onNavigate) {
              onNavigate(h.targetSceneId);
            }
          }}
        >
          <div className="hotspot-ring">
            <ArrowUp size={20} />
          </div>
          <div className="hotspot-label">{h.title}</div>
        </div>
      ))}

      {/* Camera HUD Overlays */}
      {isLoggedIn && (
        <div className="viewer-hud-top" style={{ top: 'auto', bottom: '24px', left: '24px' }}>
          <div className="glass-panel" style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Compass size={14} className="primary-color" style={{ transform: `rotate(${compassAngle}deg)`, transition: 'transform 0.1s linear' }} />
            <span>Dirección: {compassAngle}°</span>
          </div>
        </div>
      )}

      <div className="viewer-hud-right">
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom(prev => Math.min(prev + 10, 110))} title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => setZoom(prev => Math.max(prev - 10, 30))} title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button className="btn btn-secondary btn-sm" onClick={() => { lonRef.current = 0; latRef.current = 0; setCompassAngle(0); }} title="Restablecer">
          <RotateCcw size={16} />
        </button>
      </div>

      {isEditorMode && (
        <div style={{ position: 'absolute', bottom: '15px', right: '15px', background: 'rgba(0,0,0,0.8)', padding: '6px 12px', borderRadius: '6px', fontSize: '0.75rem', border: '1px solid var(--primary)' }}>
          Click en la pared/vista para crear hotspot
        </div>
      )}
    </div>
  );
}
