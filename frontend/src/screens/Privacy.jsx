export default function Privacy() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '24px 20px 60px', fontFamily: 'sans-serif', color: '#1a1a2e', background: '#fff', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Политика конфиденциальности</h1>
      <p style={{ fontSize: 13, color: '#888', marginBottom: 24 }}>Последнее обновление: март 2026</p>

      <p style={{ lineHeight: 1.7, marginBottom: 16 }}>
        Настоящая политика конфиденциальности описывает, какие данные собирает сервис <b>АстроЛичность</b> (далее — «Сервис»), как они используются и защищаются.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>1. Какие данные мы собираем</h2>
      <ul style={{ lineHeight: 1.9, paddingLeft: 20, color: '#333' }}>
        <li>Telegram ID и имя пользователя</li>
        <li>Дата, время и место рождения</li>
        <li>История сообщений с AI-астрологом</li>
        <li>Данные партнёров и детей, введённые пользователем</li>
        <li>Информация об оплаченных подписках и покупках</li>
      </ul>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>2. Зачем мы собираем данные</h2>
      <ul style={{ lineHeight: 1.9, paddingLeft: 20, color: '#333' }}>
        <li>Расчёт натальной карты и астрологических прогнозов</li>
        <li>Персонализация ответов AI-астролога</li>
        <li>Анализ совместимости пар</li>
        <li>Отправка уведомлений (прогнозы, истечение подписки)</li>
        <li>Обработка платежей</li>
      </ul>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>3. Хранение данных</h2>
      <p style={{ lineHeight: 1.7, marginBottom: 12 }}>
        Данные хранятся на серверах <b>Supabase</b> (США/ЕС). Передача данных третьим лицам не осуществляется, за исключением:
      </p>
      <ul style={{ lineHeight: 1.9, paddingLeft: 20, color: '#333' }}>
        <li><b>Anthropic</b> — AI-обработка сообщений (без долгосрочного хранения)</li>
        <li><b>Telegram</b> — доставка уведомлений</li>
        <li><b>Cryptomus</b> — обработка крипто-платежей (при использовании)</li>
      </ul>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>4. Срок хранения</h2>
      <p style={{ lineHeight: 1.7 }}>
        Данные хранятся до момента удаления аккаунта пользователем. История чата — не более 6 месяцев. Финансовые записи — до 3 лет согласно требованиям законодательства.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>5. Права пользователя</h2>
      <p style={{ lineHeight: 1.7 }}>
        Вы вправе в любой момент <b>удалить свой аккаунт и все данные</b> через раздел «Профиль» → «Удалить аккаунт». Все данные будут удалены безвозвратно в течение 24 часов.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>6. Развлекательный характер</h2>
      <p style={{ lineHeight: 1.7 }}>
        Все астрологические прогнозы носят <b>исключительно развлекательный характер</b> и не являются научными предсказаниями. Сервис не несёт ответственности за решения, принятые на основе прогнозов.
      </p>

      <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>7. Контакты</h2>
      <p style={{ lineHeight: 1.7 }}>
        По вопросам обработки персональных данных обращайтесь:<br />
        Telegram: <a href="https://t.me/Vikusay96" style={{ color: '#9333ea' }}>@Vikusay96</a>
      </p>

      <p style={{ fontSize: 12, color: '#aaa', marginTop: 32, lineHeight: 1.6 }}>
        Сервис соответствует требованиям Федерального закона №152-ФЗ «О персональных данных».
      </p>
    </div>
  )
}
