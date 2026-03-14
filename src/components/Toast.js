import React from 'react';
import { useApp } from '../AppContext';

export default function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className="toast" style={{
          borderColor: t.type === 'error' ? '#ff2d55' : t.type === 'warning' ? '#ffd60a' : 'var(--border-accent)'
        }}>{t.msg}</div>
      ))}
    </div>
  );
}
