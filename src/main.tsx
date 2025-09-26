import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { ConfigProvider, App as AntdApp, theme } from 'antd';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { store, persistor } from './store';
import './styles.css';
import { useSelector } from 'react-redux';
import type { RootState } from './store';

function ThemedApp() {
  const darkMode = useSelector((s: RootState) => s.ui.darkMode);
  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#635bff',
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AntdApp>
    </ConfigProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemedApp />
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
