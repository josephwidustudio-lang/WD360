import React, { useState } from 'react';
import { ArrowLeft, Save, Plus, Trash2, Edit3, Compass, Check, Play } from 'lucide-react';
import ThreeDViewer from './ThreeDViewer';
import { generatePanorama } from '../utils/proceduralAssets';

export default function Editor({ 
  tour, 
  onBack, 
  onSaveTour,
  onUploadImage
}) {
  const [activeSceneId, setActiveSceneId] = useState(tour.scenes[0]?.id || '');
  const [hotspotPosition, setHotspotPosition] = useState(null);
  const [hotspotTitle, setHotspotTitle] = useState('');
  const [hotspotTargetId, setHotspotTargetId] = useState('');
  const [editingHotspotId, setEditingHotspotId] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const activeScene = tour.scenes.find(s => s.id === activeSceneId);

  // Quick preset helper to add a room
  const handleAddNewScene = (type) => {
    const names = {
      living: 'Sala Principal',
      kitchen: 'Cocina Americana',
      garden: 'Jardín Exterior'
    };
    
    // Check if room type already exists
    const id = `${type}_${Date.now()}`;
    const newScene = {
      id,
      name: `${names[type] || 'Nuevo Ambiente'} (${tour.scenes.length + 1})`,
      image: generatePanorama(type),
      hotspots: []
    };

    const updatedTour = {
      ...tour,
      scenes: [...tour.scenes, newScene]
    };
    
    onSaveTour(updatedTour);
    setActiveSceneId(id);
  };

  const handleUploadScene = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let imageUrl = '';
      if (onUploadImage) {
        // Upload to database cloud storage bucket
        imageUrl = await onUploadImage(file);
      } else {
        // Fallback local memory blob URL
        imageUrl = URL.createObjectURL(file);
      }

      if (!imageUrl) {
        setIsUploading(false);
        return;
      }

      const id = `upload_${Date.now()}`;
      
      const newScene = {
        id,
        name: file.name.split('.')[0] || 'Ambiente Subido',
        image: imageUrl,
        hotspots: []
      };

      const updatedTour = {
        ...tour,
        scenes: [...tour.scenes, newScene]
      };
      
      onSaveTour(updatedTour);
      setActiveSceneId(id);
    } catch (err) {
      console.error("Error loading image:", err);
      alert("Error al cargar la imagen. Si usas Supabase, asegúrate de haber creado el bucket 'renders360' como público.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddHotspotClick = (coords) => {
    setHotspotPosition(coords);
    // Auto-select first available other scene as target
    const otherScenes = tour.scenes.filter(s => s.id !== activeSceneId);
    if (otherScenes.length > 0) {
      setHotspotTargetId(otherScenes[0].id);
    }
  };

  const handleSaveHotspot = (e) => {
    e.preventDefault();
    if (!hotspotPosition || !hotspotTitle || !hotspotTargetId) return;

    let updatedScenes;
    if (editingHotspotId) {
      // Edit existing hotspot
      updatedScenes = tour.scenes.map(s => {
        if (s.id === activeSceneId) {
          return {
            ...s,
            hotspots: s.hotspots.map(h => h.id === editingHotspotId ? {
              ...h,
              title: hotspotTitle,
              x: hotspotPosition.x,
              y: hotspotPosition.y,
              z: hotspotPosition.z,
              targetSceneId: hotspotTargetId
            } : h)
          };
        }
        return s;
      });
    } else {
      // Create new hotspot
      const newHotspot = {
        id: `h_${Date.now()}`,
        title: hotspotTitle,
        x: hotspotPosition.x,
        y: hotspotPosition.y,
        z: hotspotPosition.z,
        targetSceneId: hotspotTargetId
      };

      updatedScenes = tour.scenes.map(s => {
        if (s.id === activeSceneId) {
          return {
            ...s,
            hotspots: [...s.hotspots, newHotspot]
          };
        }
        return s;
      });
    }

    const updatedTour = {
      ...tour,
      scenes: updatedScenes
    };

    onSaveTour(updatedTour);
    setHotspotPosition(null);
    setHotspotTitle('');
    setHotspotTargetId('');
    setEditingHotspotId(null);
  };

  const handleStartEditHotspot = (h) => {
    setEditingHotspotId(h.id);
    setHotspotPosition({ x: h.x, y: h.y, z: h.z });
    setHotspotTitle(h.title);
    setHotspotTargetId(h.targetSceneId);
  };

  const handleDeleteHotspot = (hotspotId) => {
    const updatedScenes = tour.scenes.map(s => {
      if (s.id === activeSceneId) {
        return {
          ...s,
          hotspots: s.hotspots.filter(h => h.id !== hotspotId)
        };
      }
      return s;
    });

    const updatedTour = {
      ...tour,
      scenes: updatedScenes
    };

    onSaveTour(updatedTour);
  };

  const handleDeleteScene = (sceneId) => {
    if (tour.scenes.length <= 1) {
      alert("Debes tener al menos un ambiente en tu recorrido.");
      return;
    }
    
    const updatedScenes = tour.scenes.filter(s => s.id !== sceneId);
    const updatedTour = {
      ...tour,
      scenes: updatedScenes
    };

    onSaveTour(updatedTour);
    if (activeSceneId === sceneId) {
      setActiveSceneId(updatedScenes[0].id);
    }
  };

  const otherScenes = tour.scenes.filter(s => s.id !== activeSceneId);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Editor Header */}
      <header className="navbar container" style={{ padding: '12px 24px', background: 'rgba(7, 8, 14, 0.95)', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button className="btn btn-secondary btn-sm" onClick={onBack}>
            <ArrowLeft size={16} /> Volver
          </button>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Editor de Recorrido</span>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>{tour.title}</h2>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-primary btn-sm" onClick={onBack}>
            <Check size={16} /> Finalizar Edición
          </button>
        </div>
      </header>

      {/* Editor Area */}
      <div className="editor-layout">
        
        {/* Left Panel - Scenes List */}
        <aside className="editor-sidebar">
          <div>
            <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Ambientes ({tour.scenes.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {tour.scenes.map(s => (
                <div 
                  key={s.id} 
                  className={`scene-item ${s.id === activeSceneId ? 'active' : ''}`}
                  onClick={() => {
                    setActiveSceneId(s.id);
                    setHotspotPosition(null);
                  }}
                >
                  <div className="scene-thumb" style={{ backgroundImage: `url(${s.image})` }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{s.hotspots.length} hotspots</div>
                  </div>
                  {tour.scenes.length > 1 && (
                    <button 
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteScene(s.id);
                      }}
                      title="Eliminar ambiente"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Añadir Ambiente (Render)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label className="btn btn-primary btn-sm" style={{ cursor: isUploading ? 'not-allowed' : 'pointer', margin: 0, opacity: isUploading ? 0.7 : 1 }}>
                <Plus size={14} /> {isUploading ? 'Subiendo imagen...' : 'Subir Imagen 360°'}
                <input 
                  type="file" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  disabled={isUploading}
                  onChange={handleUploadScene}
                />
              </label>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0', textAlign: 'center' }}>
                o usar ejemplos prediseñados:
              </div>

              <button className="btn btn-secondary btn-sm" onClick={() => handleAddNewScene('living')}>
                <Plus size={14} /> Sala Principal 360°
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddNewScene('kitchen')}>
                <Plus size={14} /> Cocina Americana 360°
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => handleAddNewScene('garden')}>
                <Plus size={14} /> Jardín Exterior 360°
              </button>
            </div>
          </div>
        </aside>

        {/* Center Panel - 360 Sphere view */}
        <section style={{ position: 'relative', flexGrow: 1 }}>
          {activeScene ? (
            <ThreeDViewer 
              sceneImage={activeScene.image}
              hotspots={activeScene.hotspots}
              isEditorMode={true}
              onAddHotspot={handleAddHotspotClick}
              previewHotspot={hotspotPosition ? { ...hotspotPosition, title: hotspotTitle || 'Nuevo Hotspot' } : null}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              Crea o selecciona un ambiente para comenzar.
            </div>
          )}
        </section>

        {/* Right Panel - Hotspot settings */}
        <aside className="editor-right-sidebar">
          {hotspotPosition ? (
            <form onSubmit={handleSaveHotspot} className="glass-panel" style={{ padding: '20px', border: '1px solid var(--primary)' }}>
              <h3 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Edit3 size={16} className="primary-color" /> {editingHotspotId ? 'Editar Hotspot' : 'Configurar Hotspot'}
              </h3>
              
              <div className="form-group">
                <label>Texto del Indicador</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={hotspotTitle}
                  onChange={e => setHotspotTitle(e.target.value)}
                  placeholder="Ej. Ir a Cocina"
                  required
                />
              </div>

              <div className="form-group">
                <label>Ambiente de Destino</label>
                {otherScenes.length > 0 ? (
                  <select 
                    className="form-input"
                    value={hotspotTargetId}
                    onChange={e => setHotspotTargetId(e.target.value)}
                    required
                  >
                    {otherScenes.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                ) : (
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>
                    Crea otro ambiente primero en el panel izquierdo para vincularlo.
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                Posición: X: {Math.round(hotspotPosition.x)}, Y: {Math.round(hotspotPosition.y)}, Z: {Math.round(hotspotPosition.z)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--primary)', marginBottom: '16px', fontWeight: 600 }}>
                * Haz clic en la vista 360° para cambiar su posición.
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  style={{ flex: 1 }} 
                  onClick={() => {
                    setHotspotPosition(null);
                    setEditingHotspotId(null);
                    setHotspotTitle('');
                    setHotspotTargetId('');
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary btn-sm" style={{ flex: 1 }} disabled={otherScenes.length === 0}>
                  Guardar
                </button>
              </div>
            </form>
          ) : (
            <div className="glass-panel" style={{ padding: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'center' }}>
              Haz clic en cualquier punto del render 360° para crear un nuevo hotspot de navegación.
            </div>
          )}

          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '20px' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-primary)', marginBottom: '12px' }}>Hotspots en este ambiente</h3>
            {activeScene?.hotspots.length === 0 ? (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Ninguno configurado aún.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeScene?.hotspots.map(h => {
                  const targetScene = tour.scenes.find(s => s.id === h.targetSceneId);
                  return (
                    <div key={h.id} style={{ display: 'flex', justify: 'between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px', fontSize: '0.8rem' }}>
                      <div style={{ overflow: 'hidden', flex: 1 }}>
                        <div style={{ fontWeight: 600 }}>{h.title}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Destino: {targetScene?.name || 'Desconocido'}</div>
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', padding: '4px' }}
                          onClick={() => handleStartEditHotspot(h)}
                          title="Editar / Mover Hotspot"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button 
                          style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', padding: '4px' }}
                          onClick={() => handleDeleteHotspot(h.id)}
                          title="Eliminar Hotspot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
