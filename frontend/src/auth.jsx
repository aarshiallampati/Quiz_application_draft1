import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, getToken, setToken, setUnauthorizedHandler } from './api';
import { Splash } from './components/Ui';
import { homeFor } from './utils';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setToken(null);
      setUser(null);
    });
  }, []);

  useEffect(() => {
    if (!getToken()) {
      setReady(true);
      return undefined;
    }
    let cancelled = false;
    api('/api/auth/me')
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) setToken(null);
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo(() => {
    async function establish(path, body) {
      const data = await api(path, { method: 'POST', body, auth: false });
      setToken(data.token);
      try {
        const me = await api('/api/auth/me');
        setUser(me);
        return me;
      } catch {
        setUser(data.user);
        return data.user;
      }
    }

    return {
      user,
      ready,
      login: (email, password) => establish('/api/auth/login', { email, password }),
      register: (body) => establish('/api/auth/register', body),
      signOut: () => {
        setToken(null);
        setUser(null);
      },
    };
  }, [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export function Require({ role, children }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Splash />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  if (role && user.role !== role) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}

export function Guest({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <Splash />;
  if (user) return <Navigate to={homeFor(user.role)} replace />;
  return children;
}
