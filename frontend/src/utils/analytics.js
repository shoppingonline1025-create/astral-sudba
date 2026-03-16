const ph = () => window.posthog

// Идентифицировать пользователя (вызывать после логина)
export function identifyUser(user) {
  if (!ph()) return
  ph().identify(String(user.telegram_id), {
    name: user.name,
    plan: user.subscription_status,
    birth_place: user.birth_place,
  })
}

// Трекинг событий
export function track(event, props = {}) {
  if (!ph()) return
  ph().capture(event, props)
}
