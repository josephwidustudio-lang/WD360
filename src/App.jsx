import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import Editor from './components/Editor';
import ThreeDViewer from './components/ThreeDViewer';
import { generatePanorama } from './utils/proceduralAssets';
import { Compass, Sparkles, LogOut, ArrowLeft, Layers, User, Play } from 'lucide-react';
import { isSupabaseConfigured, db } from './utils/supabaseClient';
import './App.css';

const PLAN_LIMITS = {
  starter: { maxRenders: 1, maxTours: 1 },
  pro: { maxRenders: 25, maxTours: 15 },
  enterprise: { maxRenders: 999, maxTours: 999 }
};

export default function App() {
  const [screen, setScreen] = useState('landing'); // 'landing', 'login', 'register', 'dashboard', 'editor', 'preview'
  const [user, setUser] = useState(null);
  const [tours, setTours] = useState([]);
  const [activeTour, setActiveTour] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('starter');
  
  // Auth Form State
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Fullscreen Preview states
  const [previewSceneId, setPreviewSceneId] = useState('');
  const [autoPlay, setAutoPlay] = useState(false);

  // Slideshow auto-advance effect (runs when autoPlay is enabled)
  useEffect(() => {
    if (!autoPlay || !activeTour || activeTour.scenes.length <= 1 || screen !== 'preview') return;

    const timer = setInterval(() => {
      const currentIndex = activeTour.scenes.findIndex(s => s.id === previewSceneId);
      const nextIndex = (currentIndex + 1) % activeTour.scenes.length;
      const nextSceneId = activeTour.scenes[nextIndex]?.id;
      if (nextSceneId) {
        setPreviewSceneId(nextSceneId);
      }
    }, 12000); // 12 seconds per room

    return () => clearInterval(timer);
  }, [autoPlay, previewSceneId, activeTour, screen]);

  // Initial load or restore from LocalStorage/Supabase
  useEffect(() => {
    const initApp = async () => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const tourIdParam = params.get('tourId');

      if (isSupabaseConfigured) {
        try {
          // 1. Check if loading public preview directly (embed link)
          if (viewParam === 'preview' && tourIdParam) {
            const publicTour = await db.getTourById(tourIdParam);
            if (publicTour) {
              setActiveTour(publicTour);
              setPreviewSceneId(publicTour.scenes[0]?.id || '');
              setScreen('preview');
            }
          }

          // 2. Check current session
          const sessionUser = await db.getSession();
          if (sessionUser) {
            setUser(sessionUser);
            
            // Only switch to dashboard if we are not loading a shared embed link
            if (!(viewParam === 'preview' && tourIdParam)) {
              setScreen('dashboard');
            }

            const toursList = await db.getTours();
            setTours(toursList);
          }
        } catch (err) {
          console.error("Error connecting to API backend:", err);
        }
      } else {
        // Fallback local storage
        const savedUser = localStorage.getItem('wd360_user');
        const savedTours = localStorage.getItem('wd360_tours');

        let parsedTours = [];
        if (savedTours) {
          parsedTours = JSON.parse(savedTours);
          setTours(parsedTours);
        } else {
          // Create initial demo tour
          const demoTour = {
            id: 'demo_tour',
            title: 'Apartamento Modelo Premium',
            description: 'Recorrido interactivo de muestra por una residencia de lujo moderna.',
            scenes: [
              {
                id: 'demo_living',
                name: 'Sala / Estar Principal',
                image: generatePanorama('living'),
                hotspots: [
                  {
                    id: 'dh_to_kitchen',
                    title: 'Ir a Cocina Americana',
                    x: -410,
                    y: -50,
                    z: 180,
                    targetSceneId: 'demo_kitchen'
                  }
                ]
              },
              {
                id: 'demo_kitchen',
                name: 'Cocina Gourmet',
                image: generatePanorama('kitchen'),
                hotspots: [
                  {
                    id: 'dh_to_living',
                    title: 'Regresar a Sala',
                    x: 410,
                    y: -50,
                    z: -180,
                    targetSceneId: 'demo_living'
                  },
                  {
                    id: 'dh_kitchen_to_garden',
                    title: 'Salir al Jardín',
                    x: -200,
                    y: -20,
                    z: 400,
                    targetSceneId: 'demo_garden'
                  }
                ]
              },
              {
                id: 'demo_garden',
                name: 'Jardín Exterior',
                image: generatePanorama('garden'),
                hotspots: [
                  {
                    id: 'dh_garden_to_kitchen',
                    title: 'Ingresar a la Cocina',
                    x: 200,
                    y: -20,
                    z: -400,
                    targetSceneId: 'demo_kitchen'
                  }
                ]
              }
            ]
          };
          parsedTours = [demoTour];
          setTours(parsedTours);
          localStorage.setItem('wd360_tours', JSON.stringify([demoTour]));
        }

        if (savedUser) {
          setUser(JSON.parse(savedUser));
          setScreen('dashboard');
        }

        if (viewParam === 'preview' && tourIdParam) {
          const selectedTour = parsedTours.find(t => t.id === tourIdParam);
          if (selectedTour) {
            setActiveTour(selectedTour);
            setPreviewSceneId(selectedTour.scenes[0]?.id || '');
            setScreen('preview');
          }
        }
      }
    };

    initApp();
  }, []);

  // Save tours helper
  const saveToursList = (updatedTours) => {
    setTours(updatedTours);
    try {
      localStorage.setItem('wd360_tours', JSON.stringify(updatedTours));
    } catch (e) {
      console.warn("Storage quota exceeded. Saving in-memory only.", e);
    }
  };

  const handleStartRegister = (plan) => {
    setSelectedPlan(plan);
    setScreen('register');
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    if (isSupabaseConfigured) {
      try {
        const newUser = await db.signUp(authEmail, authPassword, selectedPlan);
        setUser(newUser);
        setScreen('dashboard');
        setTours([]); // clean state for new user
      } catch (err) {
        alert(err.message || "Error al registrarse.");
      }
    } else {
      const newUser = {
        email: authEmail,
        plan: selectedPlan
      };
      setUser(newUser);
      localStorage.setItem('wd360_user', JSON.stringify(newUser));
      setScreen('dashboard');
    }
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!authEmail || !authPassword) return;

    if (isSupabaseConfigured) {
      try {
        const loggedUser = await db.signIn(authEmail, authPassword);
        setUser(loggedUser);
        setScreen('dashboard');
        
        // Fetch tours from db
        const toursList = await db.getTours();
        setTours(toursList);
      } catch (err) {
        alert(err.message || "Error al iniciar sesión.");
      }
    } else {
      const loggedUser = {
        email: authEmail,
        plan: 'pro' // Default plan for mockup login
      };
      setUser(loggedUser);
      localStorage.setItem('wd360_user', JSON.stringify(loggedUser));
      setScreen('dashboard');
    }
    setAuthEmail('');
    setAuthPassword('');
  };

  const handleLogout = async () => {
    if (isSupabaseConfigured) {
      await db.logout();
    } else {
      localStorage.removeItem('wd360_user');
    }
    setUser(null);
    setScreen('landing');
  };

  const handleUpgradePlan = async (newPlan) => {
    if (!user) return;
    const updated = { ...user, plan: newPlan };
    
    if (isSupabaseConfigured) {
      try {
        await db.updatePlan(newPlan);
        setUser(updated);
      } catch (err) {
        alert("Error al actualizar el plan en la base de datos.");
        return;
      }
    } else {
      setUser(updated);
      localStorage.setItem('wd360_user', JSON.stringify(updated));
    }
    alert(`¡Felicidades! Has actualizado tu plan a: ${newPlan.toUpperCase()}`);
  };

  const handleCreateTour = async (title, description) => {
    // Generate initial scenes
    const initialScenes = [
      {
        id: `living_${Date.now()}`,
        name: 'Sala Principal',
        image: generatePanorama('living'),
        hotspots: []
      }
    ];

    const newTour = {
      id: `tour_${Date.now()}`,
      title,
      description,
      scenes: initialScenes
    };

    if (isSupabaseConfigured) {
      try {
        await db.saveTour(newTour);
        const toursList = await db.getTours();
        setTours(toursList);
      } catch (err) {
        console.error("Error saving tour:", err);
        alert("Error al guardar el recorrido en la base de datos.");
      }
    } else {
      const updated = [...tours, newTour];
      saveToursList(updated);
    }
  };

  const handleSaveTourFromEditor = async (updatedTour) => {
    if (isSupabaseConfigured) {
      try {
        await db.saveTour(updatedTour);
        const toursList = await db.getTours();
        setTours(toursList);
        setActiveTour(updatedTour);
      } catch (err) {
        console.error("Error saving editor changes:", err);
        alert("Error al guardar cambios en la base de datos.");
      }
    } else {
      const updated = tours.map(t => t.id === updatedTour.id ? updatedTour : t);
      saveToursList(updated);
      setActiveTour(updatedTour);
    }
  };

  const handleDeleteTour = async (tourId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar este recorrido?')) {
      if (isSupabaseConfigured) {
        try {
          await db.deleteTour(tourId);
          const toursList = await db.getTours();
          setTours(toursList);
        } catch (err) {
          console.error("Error deleting tour:", err);
          alert("Error al eliminar de la base de datos.");
        }
      } else {
        const updated = tours.filter(t => t.id !== tourId);
        saveToursList(updated);
      }
    }
  };

  const handleOpenPreview = (tour) => {
    setActiveTour(tour);
    setPreviewSceneId(tour.scenes[0]?.id || '');
    setScreen('preview');
  };

  // Preview Navigation Handler
  const handlePreviewNavigate = (targetSceneId) => {
    setPreviewSceneId(targetSceneId);
  };

  const currentPreviewScene = activeTour?.scenes.find(s => s.id === previewSceneId);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* Route Views */}
      {screen === 'landing' && (
        <LandingPage 
          onStart={handleStartRegister} 
          onLoginClick={() => setScreen('login')} 
        />
      )}

      {(screen === 'login' || screen === 'register') && (
        <div className="auth-container container">
          <div className="glass-panel auth-card">
            <div className="auth-header">
              <div className="logo" style={{ justifyContent: 'center', marginBottom: '16px' }}>
                <Sparkles size={24} />
                WD360
              </div>
              <h2>{screen === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
              <p>{screen === 'login' ? 'Ingresa para gestionar tus recorridos' : 'Elige tus credenciales para comenzar'}</p>
            </div>

            <form onSubmit={screen === 'login' ? handleLogin : handleRegister}>
              <div className="form-group">
                <label>Correo Electrónico</label>
                <input 
                  type="email" 
                  className="form-input" 
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  placeholder="nombre@estudio.com" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>Contraseña</label>
                <input 
                  type="password" 
                  className="form-input" 
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  placeholder="••••••••" 
                  required 
                />
              </div>

              {screen === 'register' && (
                <div className="form-group">
                  <label>Plan Seleccionado</label>
                  <select 
                    className="form-input" 
                    value={selectedPlan} 
                    onChange={e => setSelectedPlan(e.target.value)}
                  >
                    <option value="starter">Starter - $29/mes</option>
                    <option value="pro">Pro - $79/mes</option>
                    <option value="enterprise">Enterprise - $199/mes</option>
                  </select>
                </div>
              )}

              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '16px' }}>
                {screen === 'login' ? 'Iniciar Sesión' : 'Registrarse'}
              </button>
            </form>

            <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {screen === 'login' ? (
                <>
                  ¿No tienes una cuenta?{' '}
                  <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setScreen('register')}>
                    Regístrate
                  </span>
                </>
              ) : (
                <>
                  ¿Ya tienes una cuenta?{' '}
                  <span style={{ color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setScreen('login')}>
                    Ingresa
                  </span>
                </>
              )}
            </div>

            <button className="btn btn-secondary btn-sm" style={{ width: '100%', marginTop: '16px' }} onClick={() => setScreen('landing')}>
              Volver a la página principal
            </button>
          </div>
        </div>
      )}

      {screen === 'dashboard' && user && (
        <Dashboard 
          user={user}
          tours={tours}
          onLogout={handleLogout}
          onSelectTour={(tour) => {
            setActiveTour(tour);
            setScreen('editor');
          }}
          onPreviewTour={handleOpenPreview}
          onCreateTour={handleCreateTour}
          onDeleteTour={handleDeleteTour}
          onUpgradePlan={handleUpgradePlan}
        />
      )}

      {screen === 'editor' && activeTour && (
        <Editor 
          tour={activeTour}
          onBack={() => setScreen('dashboard')}
          onSaveTour={handleSaveTourFromEditor}
          onUploadImage={isSupabaseConfigured ? db.uploadSceneImage : null}
          maxRendersLimit={PLAN_LIMITS[user?.plan || 'starter']?.maxRenders || 1}
          currentRendersCount={tours.reduce((acc, t) => acc + (t.scenes ? t.scenes.length : 0), 0)}
        />
      )}

      {screen === 'preview' && activeTour && (
        <div className="viewer-layout-full">
          {/* Top/Bottom HUD Bar (only visible when user is logged in) */}
          {user && (
            <div className="viewer-hud-top" style={{ top: 'auto', bottom: '72px', left: '20px', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => setScreen('dashboard')}>
                <ArrowLeft size={16} /> Volver al Dashboard
              </button>
              <div className="glass-panel" style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Vista de Cliente / Compartible</span>
                <span style={{ fontWeight: 600, fontSize: '0.95rem' }}>{activeTour.title}</span>
              </div>
            </div>
          )}

          {/* Active scene name overlay */}
          <div style={{ position: 'absolute', top: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 100 }} className="glass-panel">
            <div style={{ padding: '8px 20px', fontWeight: 600, fontSize: '1rem', background: 'rgba(0,0,0,0.4)', borderRadius: '12px' }}>
              {currentPreviewScene?.name || 'Cargando...'}
            </div>
          </div>

          {/* Fullscreen 3D Panorama view */}
          {currentPreviewScene ? (
            <ThreeDViewer 
              sceneImage={currentPreviewScene.image}
              hotspots={currentPreviewScene.hotspots}
              onNavigate={handlePreviewNavigate}
              autoRotate={autoPlay}
              isLoggedIn={!!user}
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-secondary)' }}>
              No hay ambientes creados en este recorrido.
            </div>
          )}

          {/* Floor / Scene direct picker list at bottom */}
          <div className="viewer-controls-overlay">
            <button 
              className={`btn btn-sm ${autoPlay ? 'btn-primary' : 'btn-secondary'}`} 
              onClick={() => setAutoPlay(!autoPlay)}
              style={{ marginRight: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Girar automáticamente y pasar de ambiente"
            >
              <Play size={12} fill={autoPlay ? "white" : "none"} />
              {autoPlay ? 'Auto-Tour: ON' : 'Auto-Tour'}
            </button>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginRight: '8px' }}>Ambiente:</span>
            {activeTour.scenes.map(s => (
              <button 
                key={s.id}
                className={`btn btn-sm ${s.id === previewSceneId ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPreviewSceneId(s.id)}
              >
                {s.name.split(' (')[0]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
