import React, { useState } from 'react';
import { 
  Plus, Eye, Edit3, Trash2, Layers, CheckCircle2, 
  TrendingUp, BarChart3, Database, HardDrive, Compass, LogOut,
  Share2, Code, Copy, Check
} from 'lucide-react';

export default function Dashboard({ 
  user, 
  tours, 
  onLogout, 
  onSelectTour, 
  onPreviewTour,
  onCreateTour, 
  onDeleteTour,
  onUpgradePlan 
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTourTitle, setNewTourTitle] = useState('');
  const [newTourDesc, setNewTourDesc] = useState('');
  
  // Share states
  const [shareTour, setShareTour] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedIframe, setCopiedIframe] = useState(false);

  const handleCopyLink = () => {
    if (!shareTour) return;
    const embedUrl = `${window.location.origin}/?view=preview&tourId=${shareTour.id}`;
    navigator.clipboard.writeText(embedUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyIframe = () => {
    if (!shareTour) return;
    const embedUrl = `${window.location.origin}/?view=preview&tourId=${shareTour.id}`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="600px" frameborder="0" allowfullscreen allow="xr-spatial-tracking; gyroscope; accelerometer"></iframe>`;
    navigator.clipboard.writeText(iframeCode);
    setCopiedIframe(true);
    setTimeout(() => setCopiedIframe(false), 2000);
  };

  // Define limits based on plan
  const planLimits = {
    starter: { name: 'Starter', maxRenders: 5, maxTours: 2 },
    pro: { name: 'Professional', maxRenders: 25, maxTours: 15 },
    enterprise: { name: 'Agency / Enterprise', maxRenders: 999, maxTours: 999 }
  };

  const currentLimit = planLimits[user.plan] || planLimits.starter;

  // Calculate current usage
  const totalRendersUsed = tours.reduce((acc, tour) => acc + (tour.scenes ? tour.scenes.length : 0), 0);
  const totalToursUsed = tours.length;

  const renderLimitPercentage = Math.min((totalRendersUsed / currentLimit.maxRenders) * 100, 100);
  const tourLimitPercentage = Math.min((totalToursUsed / currentLimit.maxTours) * 100, 100);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newTourTitle) return;
    
    // Check limits
    if (totalToursUsed >= currentLimit.maxTours) {
      alert(`Has alcanzado el límite de tu plan (${currentLimit.maxTours} recorridos). Por favor mejora tu plan.`);
      return;
    }

    onCreateTour(newTourTitle, newTourDesc);
    setNewTourTitle('');
    setNewTourDesc('');
    setShowCreateModal(false);
  };

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div>
          <div className="logo" style={{ marginBottom: '30px' }}>
            <Compass size={24} />
            WD360
          </div>
          
          <nav className="sidebar-menu">
            <div className="sidebar-item active">
              <Layers size={18} />
              <span>Mis Proyectos</span>
            </div>
          </nav>

          {/* Plan Limit Card */}
          <div className="glass-panel plan-usage-card">
            <div className="usage-title">
              <span>Plan: {currentLimit.name}</span>
              <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>Active</span>
            </div>
            
            {/* Renders limit progress */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Imágenes Renders 360°</span>
                <span style={{ marginLeft: 'auto' }}>
                  {totalRendersUsed} / {currentLimit.maxRenders === 999 ? '∞' : currentLimit.maxRenders}
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: `${renderLimitPercentage}%` }} />
              </div>
            </div>

            {/* Tours limit progress */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                <span>Tours Virtuales</span>
                <span style={{ marginLeft: 'auto' }}>
                  {totalToursUsed} / {currentLimit.maxTours === 999 ? '∞' : currentLimit.maxTours}
                </span>
              </div>
              <div className="usage-bar">
                <div className="usage-fill" style={{ width: `${tourLimitPercentage}%` }} />
              </div>
            </div>

            {user.plan !== 'enterprise' && (
              <button 
                className="btn btn-primary btn-sm" 
                style={{ width: '100%', marginTop: '16px' }}
                onClick={() => onUpgradePlan(user.plan === 'starter' ? 'pro' : 'enterprise')}
              >
                Subir de Plan
              </button>
            )}
          </div>
        </div>

        {/* User Card at bottom */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', marginBottom: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--primary-gradient)', display: 'flex', alignItems: 'center', justify: 'center', fontWeight: 'bold' }}>
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontWeight: '600', fontSize: '0.85rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{user.email}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cliente Activo</div>
            </div>
          </div>
          <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={onLogout}>
            <LogOut size={14} /> Salir
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="main-content">
        <header className="dashboard-header">
          <div>
            <h1 style={{ fontSize: '2.2rem', marginBottom: '8px' }}>Mis Recorridos 360°</h1>
            <p style={{ color: 'var(--text-secondary)' }}>Crea y conecta renders interiores y exteriores para tus clientes.</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
            <Plus size={18} /> Nuevo Proyecto
          </button>
        </header>

        {/* Stats Grid */}
        <section className="stats-grid">
          <div className="glass-panel stat-card">
            <div className="stat-icon">
              <TrendingUp size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Vistas Totales</div>
              <div className="stat-value">2,845</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon">
              <HardDrive size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Límite de Ancho de Banda</div>
              <div className="stat-value">94.2%</div>
            </div>
          </div>

          <div className="glass-panel stat-card">
            <div className="stat-icon">
              <BarChart3 size={24} />
            </div>
            <div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Clientes Satisfechos</div>
              <div className="stat-value">99.8%</div>
            </div>
          </div>
        </section>

        {/* Projects List */}
        {tours.length === 0 ? (
          <div className="glass-panel" style={{ padding: '60px', textAlign: 'center' }}>
            <Layers size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '1.25rem', marginBottom: '8px' }}>Aún no tienes proyectos creados</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '400px', margin: '0 auto 24px auto' }}>
              Crea tu primer recorrido interactivo agregando tus renders y estableciendo la navegación.
            </p>
            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
              Crear Recorrido
            </button>
          </div>
        ) : (
          <div className="tours-grid">
            {tours.map(tour => (
              <div key={tour.id} className="glass-panel tour-card">
                <div 
                  className="tour-preview"
                  style={{ 
                    backgroundImage: `url(${tour.scenes && tour.scenes.length > 0 ? tour.scenes[0].image : ''})` 
                  }}
                >
                  <span className="tour-badge">
                    <CheckCircle2 size={12} style={{ color: 'var(--success)' }} /> Activo
                  </span>
                </div>
                <div className="tour-card-body">
                  <h3 style={{ fontSize: '1.15rem' }}>{tour.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: '1.5', minHeight: '40px' }}>
                    {tour.description || 'Sin descripción.'}
                  </p>
                  
                  <div style={{ display: 'flex', gap: '8px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>{tour.scenes ? tour.scenes.length : 0} Ambientes</span>
                    <span>•</span>
                    <span>{tour.scenes ? tour.scenes.reduce((sum, s) => sum + (s.hotspots ? s.hotspots.length : 0), 0) : 0} Conexiones</span>
                  </div>

                  <div className="tour-card-footer">
                    <button className="btn btn-secondary btn-sm" onClick={() => onPreviewTour(tour)}>
                      <Eye size={14} /> Preview
                    </button>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setShareTour(tour)} title="Compartir / Incrustar en Web">
                        <Share2 size={14} />
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => onSelectTour(tour)} title="Editar Recorrido">
                        <Edit3 size={14} />
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => onDeleteTour(tour.id)} title="Eliminar Recorrido">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <form className="glass-panel auth-card" onSubmit={handleCreate}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '20px' }}>Crear Recorrido Virtual</h2>
            <div className="form-group">
              <label>Nombre del Proyecto</label>
              <input 
                type="text" 
                className="form-input" 
                value={newTourTitle} 
                onChange={e => setNewTourTitle(e.target.value)} 
                placeholder="Ej. Casa de Campo M1"
                required 
              />
            </div>
            <div className="form-group">
              <label>Descripción</label>
              <textarea 
                className="form-input" 
                value={newTourDesc} 
                onChange={e => setNewTourDesc(e.target.value)} 
                placeholder="Breve descripción para tus clientes..."
                style={{ resize: 'vertical', minHeight: '80px' }}
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowCreateModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                Crear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Share/Embed Modal */}
      {shareTour && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '100%', maxWidth: '580px', padding: '30px', position: 'relative' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Share2 size={22} className="primary-color" /> Compartir e Incrustar Recorrido
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
              Copia el enlace directo para compartir con tus clientes o copia el código iframe para incrustar el tour 360° en tu sitio web.
            </p>

            {/* Direct Link Share */}
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <label>Enlace Directo / URL de Compartir</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  readOnly 
                  className="form-input" 
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                  value={`${window.location.origin}/?view=preview&tourId=${shareTour.id}`}
                />
                <button className="btn btn-secondary" onClick={handleCopyLink} title="Copiar Enlace">
                  {copiedLink ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Iframe Embed Code */}
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Código de Inserción HTML (Iframe)</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <textarea 
                  readOnly 
                  className="form-input" 
                  style={{ background: 'rgba(0,0,0,0.2)', fontSize: '0.75rem', fontFamily: 'monospace', minHeight: '80px', resize: 'none' }}
                  value={`<iframe src="${window.location.origin}/?view=preview&tourId=${shareTour.id}" width="100%" height="600px" frameborder="0" allowfullscreen allow="xr-spatial-tracking; gyroscope; accelerometer"></iframe>`}
                />
                <button className="btn btn-secondary" style={{ alignSelf: 'stretch' }} onClick={handleCopyIframe} title="Copiar Iframe">
                  {copiedIframe ? <Check size={16} style={{ color: 'var(--success)' }} /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setShareTour(null)}>
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
