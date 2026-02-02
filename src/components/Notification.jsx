import { useEffect } from 'react'

export function Notification({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  const colors = {
    success: { bg: '#d4edda', text: '#155724', icon: '' },
    error: { bg: '#f8d7da', text: '#721c24', icon: '' },
    warning: { bg: '#fff3cd', text: '#856404', icon: '' },
    info: { bg: '#d1ecf1', text: '#0c5460', icon: '' }
  }

  const style = colors[type] || colors.success

  return (
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        background: style.bg,
        color: style.text,
        padding: '16px 20px',
        borderRadius: '10px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        border: `1px solid ${style.text}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        fontSize: '14px',
        fontWeight: '500',
        zIndex: 10000,
        maxWidth: '400px',
        animation: 'slideIn 0.3s ease-in-out',
      }}
    >
      <span style={{ fontSize: '20px' }}>{style.icon}</span>
      <div>{message}</div>
      <style>
        {`
          @keyframes slideIn {
            from {
              transform: translateX(400px);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}
