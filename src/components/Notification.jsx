import { useEffect } from 'react'

export function Notification({ message, type = 'success', onClose, duration = 3000 }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(onClose, duration)
      return () => clearTimeout(timer)
    }
  }, [message, duration, onClose])

  if (!message) return null

  // Determine title based on message content
  const getTitleForMessage = () => {
    if (message.includes('Insufficient Cash')) return 'Insufficient Cash'
    if (message.includes('Insufficient')) return 'Insufficient Amount'
    if (message.includes('Access Denied')) return 'Access Denied'
    if (message.includes('Login Failed')) return 'Login Failed'
    if (message.includes('Error')) return 'Error'
    return 'Error'
  }

  const stylesByType = {
    success: {
      accent: '#6B7C65',
      bg: '#f6fbf5',
      title: 'Success',
      button: '#6B7C65'
    },
    error: {
      accent: '#d9534f',
      bg: '#fff6f6',
      title: getTitleForMessage(),
      button: '#d9534f'
    },
    warning: {
      accent: '#e5c546',
      bg: '#fffdf5',
      title: 'Warning',
      button: '#c9a92f'
    },
    info: {
      accent: '#5a6955',
      bg: '#f5f7f5',
      title: 'Notice',
      button: '#5a6955'
    }
  }

  const current = stylesByType[type] || stylesByType.success

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        animation: 'fadeInOverlay 0.2s ease-out'
      }}
    >
      <div
        style={{
          width: 'min(90vw, 560px)',
          background: '#ffffff',
          borderRadius: '28px',
          padding: '34px 30px 28px',
          boxShadow: '0 18px 45px rgba(0,0,0,0.25)',
          textAlign: 'center',
          border: '1px solid #e5e5e5',
          animation: 'popupIn 0.25s ease-out'
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: current.bg,
            border: `2px solid ${current.accent}`,
            margin: '0 auto 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '34px',
            color: current.accent,
            fontWeight: 'bold'
          }}
        >
          {type === 'error' ? '!' : type === 'warning' ? '!' : '✓'}
        </div>

        <h2
          style={{
            margin: '0 0 14px 0',
            fontSize: '26px',
            fontWeight: '800',
            color: '#2f2f2f'
          }}
        >
          {current.title}
        </h2>

        <p
          style={{
            margin: '0 0 28px 0',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#666',
            wordBreak: 'break-word'
          }}
        >
          {message}
        </p>

        <button
          onClick={onClose}
          style={{
            minWidth: '150px',
            padding: '14px 28px',
            border: 'none',
            borderRadius: '12px',
            background: current.button,
            color: '#fff',
            fontSize: '16px',
            fontWeight: '700',
            cursor: 'pointer',
            boxShadow: '0 6px 14px rgba(0,0,0,0.12)'
          }}
        >
          OK
        </button>
      </div>

      <style>
        {`
          @keyframes fadeInOverlay {
            from {
              opacity: 0;
            }
            to {
              opacity: 1;
            }
          }

          @keyframes popupIn {
            from {
              transform: scale(0.95) translateY(10px);
              opacity: 0;
            }
            to {
              transform: scale(1) translateY(0);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  )
}