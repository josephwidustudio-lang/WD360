// Helper to procedurally generate 360° panorama images
export function generatePanorama(roomType) {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d');

  // Clear canvas
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const w = canvas.width;
  const h = canvas.height;

  if (roomType === 'living') {
    // Ceiling (top 40%)
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(0, 0, w, h * 0.4);

    // Floor (bottom 40%)
    ctx.fillStyle = '#78350f'; // wood look
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    // Draw floor boards
    ctx.strokeStyle = '#451a03';
    ctx.lineWidth = 2;
    for (let i = 0; i < w; i += 80) {
      ctx.beginPath();
      ctx.moveTo(i, h * 0.6);
      ctx.lineTo(i + (i - w/2) * 0.5, h);
      ctx.stroke();
    }

    // Walls (middle 20% + overlap)
    ctx.fillStyle = '#1e3a8a'; // Blue walls
    ctx.fillRect(0, h * 0.35, w, h * 0.3);

    // Add a window on one wall
    ctx.fillStyle = '#0284c7'; // glass view (sky)
    ctx.fillRect(w * 0.1, h * 0.38, w * 0.15, h * 0.2);
    // Draw hills/sun outside the window
    ctx.fillStyle = '#22c55e'; // Green hills
    ctx.beginPath();
    ctx.arc(w * 0.15, h * 0.58, 80, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#eab308'; // Sun
    ctx.beginPath();
    ctx.arc(w * 0.22, h * 0.42, 20, 0, Math.PI * 2);
    ctx.fill();
    // Window frames
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(w * 0.1, h * 0.38, w * 0.15, h * 0.2);
    ctx.beginPath();
    ctx.moveTo(w * 0.175, h * 0.38);
    ctx.lineTo(w * 0.175, h * 0.58);
    ctx.moveTo(w * 0.1, h * 0.48);
    ctx.lineTo(w * 0.25, h * 0.48);
    ctx.stroke();

    // Painting on another wall
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(w * 0.45, h * 0.4, 120, 100);
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(w * 0.48, h * 0.47, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.45, h * 0.4, 120, 100);

    // Sofa/Furniture outline
    ctx.fillStyle = '#475569';
    ctx.fillRect(w * 0.7, h * 0.5, 240, 80);
    ctx.fillStyle = '#334155';
    ctx.fillRect(w * 0.72, h * 0.54, 200, 40);

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ESTAR / SALA PRINCIPAL (360°)', w * 0.4, h * 0.3);

  } else if (roomType === 'kitchen') {
    // Ceiling
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, w, h * 0.4);

    // Floor
    ctx.fillStyle = '#e2e8f0'; // tile look
    ctx.fillRect(0, h * 0.6, w, h * 0.4);
    // Draw tiles
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    for (let i = 0; i < w; i += 100) {
      ctx.beginPath();
      ctx.moveTo(i, h * 0.6);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let i = 0; i < h * 0.4; i += 50) {
      ctx.beginPath();
      ctx.moveTo(0, h * 0.6 + i);
      ctx.lineTo(w, h * 0.6 + i);
      ctx.stroke();
    }

    // Walls
    ctx.fillStyle = '#0f766e'; // teal walls
    ctx.fillRect(0, h * 0.35, w, h * 0.3);

    // Kitchen Counter & cabinets
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(w * 0.2, h * 0.5, w * 0.5, h * 0.15); // counter
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(w * 0.2, h * 0.48, w * 0.5, 15); // marble top
    
    // Cabinet doors
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    for (let x = w * 0.22; x < w * 0.68; x += 80) {
      ctx.strokeRect(x, h * 0.52, 60, 60);
    }

    // Fridge
    ctx.fillStyle = '#cbd5e1';
    ctx.fillRect(w * 0.75, h * 0.4, 100, 180);
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(w * 0.77, h * 0.42, 6, 60); // door handle

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('COCINA GOURMET (360°)', w * 0.4, h * 0.3);

  } else {
    // Exterior/Garden
    // Sky
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h * 0.6);
    skyGrad.addColorStop(0, '#0284c7');
    skyGrad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h * 0.6);

    // Grass
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, h * 0.6, w, h * 0.4);

    // Sun in sky
    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.2, 50, 0, Math.PI * 2);
    ctx.fill();

    // Trees
    ctx.fillStyle = '#166534';
    for (let x = 100; x < w; x += 400) {
      // Tree crown
      ctx.beginPath();
      ctx.arc(x, h * 0.5, 60, 0, Math.PI * 2);
      ctx.arc(x - 40, h * 0.52, 50, 0, Math.PI * 2);
      ctx.arc(x + 40, h * 0.52, 50, 0, Math.PI * 2);
      ctx.fill();
      // Trunk
      ctx.fillStyle = '#78350f';
      ctx.fillRect(x - 15, h * 0.56, 30, 60);
      ctx.fillStyle = '#166534';
    }

    // House facade render
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(w * 0.7, h * 0.3, 300, 180);
    ctx.fillStyle = '#451a03'; // roof
    ctx.beginPath();
    ctx.moveTo(w * 0.68, h * 0.3);
    ctx.lineTo(w * 0.85, h * 0.2);
    ctx.lineTo(w * 1.02, h * 0.3);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('JARDÍN EXTERIOR (360°)', w * 0.4, h * 0.15);
  }

  // Draw some helpful orientation guides/compass lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, h/2);
  ctx.lineTo(w, h/2);
  ctx.stroke();

  return canvas.toDataURL('image/jpeg', 0.85);
}
