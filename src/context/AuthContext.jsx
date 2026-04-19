import { createContext, useContext, useEffect, useReducer } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

// Lazy initializer — reads token from sessionStorage on every app mount/refresh.
// sessionStorage persists across page refreshes but clears when the browser tab
// is closed, so users start fresh when they reopen the project.
const getInitialState = () => {
  // Clean up any stale token from old localStorage-based sessions
  localStorage.removeItem('smartpark-token');
  const token = sessionStorage.getItem('smartpark-token');
  return {
    user: null,
    token,
    loading: !!token,
    isAuthenticated: !!token,
  };
};

function authReducer(state, action) {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
    case 'REGISTER_SUCCESS':
      sessionStorage.setItem('smartpark-token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        isAuthenticated: true,
      };
    case 'USER_LOADED':
      return {
        ...state,
        user: action.payload,
        token: sessionStorage.getItem('smartpark-token'),
        loading: false,
        isAuthenticated: true,
      };
    case 'AUTH_ERROR':
    case 'LOGOUT':
      sessionStorage.removeItem('smartpark-token');
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        isAuthenticated: false,
      };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, null, getInitialState);

  useEffect(() => {
    let cancelled = false;

    const loadUser = async () => {
      const token = sessionStorage.getItem('smartpark-token');
      if (!token) {
        if (!cancelled) dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      try {
        const res = await api.get('/auth/profile');
        if (!cancelled) {
          dispatch({ type: 'USER_LOADED', payload: res.data.user });
        }
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          dispatch({ type: 'AUTH_ERROR' });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    loadUser();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email: email.trim().toLowerCase(), password });
    dispatch({ type: 'LOGIN_SUCCESS', payload: res.data });
    return res.data;
  };

  const register = async (userData) => {
    const payload = {
      ...userData,
      name: userData.name?.trim(),
      email: userData.email?.trim().toLowerCase(),
      vehicleNumber: userData.vehicleNumber?.trim(),
      phoneNumber: userData.phoneNumber?.trim(),
    };
    const res = await api.post('/auth/register', payload);
    dispatch({ type: 'REGISTER_SUCCESS', payload: res.data });
    return res.data;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    sessionStorage.clear();
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile', data);
    dispatch({ type: 'UPDATE_USER', payload: res.data.user });
    return res.data;
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        updateProfile,
        dispatch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
