import React from 'react';
import { Layers, Shield, Eye, ArrowRight, Check, Sparkles } from 'lucide-react';
import ThreeDViewer from './ThreeDViewer';
import { generatePanorama } from '../utils/proceduralAssets';

export default function LandingPage({ onStart, onLoginClick }) {
  // Pre-generate standard rooms for demo
  const demoScenes = {
    living: generatePanorama('living'),
    kitchen: generatePanorama('kitchen'),
  };

  const [activeDemoScene, setActiveDemoScene] = React.useState('living');
  
  const demoHotspots = [
    {
      id: 'h1',
      title: 'Ir a Cocina',
      x: -400,
      y: -50,
      z: 200,
      targetSceneId: 'kitchen'
    }
  ];

  const kitchenHotspots = [
    {
      id: 'h2',
      title: 'Regresar a Sala',
      x: 400,
      y: -50,
      z: -200,
      targetSceneId: 'living'
    }
  ];

  const handleDemoNavigate = (targetId) => {
    setActiveDemoScene(targetId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <header className="navbar container">
        <div className="logo">
          <Sparkles size={24} />
          WD360
        </div>
        <nav className="nav-links">
          <a href="#features" className="nav-link">Características</a>
          <a href="#demo" className="nav-link">Demo Vivo</a>
          <a href="#pricing" className="nav-link">Planes</a>
          <button className="btn btn-secondary btn-sm" onClick={onLoginClick}>Ingresar</button>
          <button className="btn btn-primary btn-sm" onClick={() => onStart('starter')}>Registrarse</button>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="hero container">
        <h1>Transforma Renders en Recorridos 360° Interactivos</h1>
        <p>
          Sube tus imágenes equirrectangulares de interiores y exteriores. Conecta tus espacios con hotspots de navegación y vende tus proyectos arquitectónicos de forma interactiva y premium.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => onStart('pro')}>
            Comenzar Prueba Gratis <ArrowRight size={18} />
          </button>
          <a href="#demo" className="btn btn-secondary">
            Ver Demo Interactiva
          </a>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2 style={{ fontSize: '2.2rem', marginBottom: '16px' }}>Prueba el Visor 360° en Vivo</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
          Arrastra para explorar la habitación. Haz clic en el indicador del compás para desplazarte a la cocina.
        </p>
        <div className="demo-showcase-container glass-panel">
          <ThreeDViewer 
            sceneImage={demoScenes[activeDemoScene]} 
            hotspots={activeDemoScene === 'living' ? demoHotspots : kitchenHotspots}
            onNavigate={handleDemoNavigate}
          />
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="container" style={{ padding: '80px 0' }}>
        <div style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>Todo lo que necesitas para vender más</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Creado para estudios de arquitectura, inmobiliarias y diseñadores en 3D.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          <div className="glass-panel" style={{ padding: '32px' }}>
            <div className="stat-icon" style={{ marginBottom: '20px' }}>
              <Eye size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Visor Inmersivo</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Navegación ultra fluida a 360 grados por WebGL, optimizada para móviles, tablets y computadoras.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div className="stat-icon" style={{ marginBottom: '20px' }}>
              <Layers size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Hotspots Interconectados</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Coloca puntos interactivos directamente sobre el espacio tridimensional para guiar al cliente entre pisos o habitaciones.
            </p>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <div className="stat-icon" style={{ marginBottom: '20px' }}>
              <Shield size={24} />
            </div>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '12px' }}>Planes y Límites de Carga</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Configura límites para gestionar a tus clientes y controlar el consumo de carga de renders de acuerdo a tu modelo de negocio.
            </p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="pricing-section container">
        <h2 className="pricing-title">Planes flexibles para cada necesidad</h2>
        <p className="pricing-subtitle">Comienza a potenciar la visualización de tus proyectos inmobiliarios hoy mismo.</p>

        <div className="pricing-grid">
          {/* Starter Plan */}
          <div className="glass-panel pricing-card">
            <h3 className="plan-name">Plan Starter</h3>
            <div className="plan-price">$29<span> / mes</span></div>
            <p style={{ color: 'var(--text-muted)' }}>Ideal para profesionales independientes.</p>
            <ul className="plan-features">
              <li><Check size={16} /> Hasta 5 renders 360°</li>
              <li><Check size={16} /> 2 Tours Interactivos activos</li>
              <li><Check size={16} /> Marca de agua WD360</li>
              <li><Check size={16} /> Soporte estándar</li>
            </ul>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => onStart('starter')}>
              Comenzar con Starter
            </button>
          </div>

          {/* Professional Plan */}
          <div className="glass-panel pricing-card popular">
            <div className="popular-badge">MÁS POPULAR</div>
            <h3 className="plan-name">Plan Pro</h3>
            <div className="plan-price">$79<span> / mes</span></div>
            <p style={{ color: 'var(--text-muted)' }}>Perfecto para estudios de diseño medianos.</p>
            <ul className="plan-features">
              <li><Check size={16} /> Hasta 25 renders 360°</li>
              <li><Check size={16} /> Tours interactivos ilimitados</li>
              <li><Check size={16} /> Sin marca de agua</li>
              <li><Check size={16} /> Personalización de marca propia</li>
              <li><Check size={16} /> Soporte prioritario</li>
            </ul>
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => onStart('pro')}>
              Comenzar con Pro
            </button>
          </div>

          {/* Enterprise Plan */}
          <div className="glass-panel pricing-card">
            <h3 className="plan-name">Plan Agency / Enterprise</h3>
            <div className="plan-price">$199<span> / mes</span></div>
            <p style={{ color: 'var(--text-muted)' }}>Para grandes constructoras y agencias.</p>
            <ul className="plan-features">
              <li><Check size={16} /> Cargas ilimitadas de renders</li>
              <li><Check size={16} /> Tours y visitas ilimitadas</li>
              <li><Check size={16} /> Dominio personalizado</li>
              <li><Check size={16} /> Soporte dedicado 24/7</li>
              <li><Check size={16} /> Acceso multiusuario</li>
            </ul>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: 'auto' }} onClick={() => onStart('enterprise')}>
              Contactar Agencia
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="main-footer container">
        <p>© 2026 WD360 Studio. Todos los derechos reservados. Diseñado con alta fidelidad.</p>
      </footer>
    </div>
  );
}
