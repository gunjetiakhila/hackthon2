import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type PageKey =
  | 'dashboard' | 'applications' | 'documents' | 'compliance'
  | 'evc' | 'alerts' | 'reports' | 'audit' | 'settings' | 'login';

interface RouterValue {
  page: PageKey;
  param: string | null;
  navigate: (page: PageKey, param?: string) => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function parseHash(): { page: PageKey; param: string | null } {
  const h = window.location.hash.replace(/^#\/?/, '');
  const [page, param] = h.split('/');
  return { page: (page as PageKey) || 'dashboard', param: param || null };
}

export function RouterProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(parseHash);

  useEffect(() => {
    const onHash = () => setState(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (page: PageKey, param?: string) => {
    window.location.hash = `/${page}${param ? `/${param}` : ''}`;
  };

  return <RouterContext.Provider value={{ ...state, navigate }}>{children}</RouterContext.Provider>;
}

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}
