import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { listNotifications, markAllNotificationsRead, markNotificationRead } from '../../api/notifications'
import ListenButton from '../../components/ListenButton/ListenButton'
import { parseUtcDate } from '../../utils/parseUtcDate'
import './NotificationsScreen.css'

/**
 * A real, persisted (server-side, via backend/notifications.py) history
 * — not just localStorage, so it isn't lost on a cache clear and could
 * eventually sync across a person's devices. If the backend can't be
 * reached, this just shows an empty state rather than fabricating
 * history — there's nothing honest to show in that case.
 */
function NotificationsScreen() {
  const { t } = useTranslation()
  const [notifications, setNotifications] = useState([])
  const [loadFailed, setLoadFailed] = useState(false)

  const refresh = () => {
    listNotifications()
      .then((data) => {
        setNotifications(data)
        setLoadFailed(false)
      })
      .catch(() => setLoadFailed(true))
  }

  useEffect(refresh, [])

  const handleMarkRead = async (id) => {
    try {
      await markNotificationRead(id)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
    } catch {
      // Best-effort — the item just stays unread until the next refresh.
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // Best-effort, same as above.
    }
  }

  return (
    <div className="notifications-screen">
      <div className="notifications-screen__header">
        <h1 className="notifications-screen__title">{t('notifications.title')}</h1>
        {notifications.length > 0 && (
          <button type="button" className="notifications-screen__mark-all" onClick={handleMarkAllRead}>
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loadFailed && (
        <p className="notifications-screen__empty">Could not reach the backend just now.</p>
      )}

      {!loadFailed && notifications.length === 0 && (
        <p className="notifications-screen__empty">{t('notifications.empty')}</p>
      )}

      <ul className="notifications-screen__list">
        {notifications.map((notification) => (
          <li
            key={notification.id}
            className={`notifications-screen__item notifications-screen__item--${notification.level} ${
              notification.read ? 'notifications-screen__item--read' : ''
            }`}
          >
            <div className="notifications-screen__item-body">
              <p className="notifications-screen__item-title">{notification.title}</p>
              <p className="notifications-screen__item-text">{notification.body}</p>
              <p className="notifications-screen__item-time">
                {parseUtcDate(notification.created_at).toLocaleString()}
              </p>
            </div>
            <div className="notifications-screen__item-actions">
              <ListenButton text={`${notification.title}. ${notification.body}`} />
              {!notification.read && (
                <button
                  type="button"
                  className="notifications-screen__ack"
                  onClick={() => handleMarkRead(notification.id)}
                >
                  {t('notifications.acknowledge')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default NotificationsScreen
