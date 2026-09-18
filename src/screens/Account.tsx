import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Badge, Button, Card, DemoNote, SectionTitle } from '../components/ui'
import { useApp } from '../store/app'
import { useL } from '../i18n/LangContext'
import { initials, isEmail, readAvatar } from '../store/account'

type Mode = 'signIn' | 'signUp' | 'reset'

function Field({
  label, type = 'text', value, onChange, placeholder, autoComplete,
}: {
  label: string
  type?: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  autoComplete?: string
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] transition-colors placeholder:text-ink-muted focus:border-brand-400"
      />
    </label>
  )
}

/** Форма входа, регистрации и смены пароля. */
function AuthForms() {
  const L = useL()
  const { signIn, signUp, resetPassword, hasAccount } = useApp()
  const [mode, setMode] = useState<Mode>(hasAccount ? 'signIn' : 'signUp')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [repeat, setRepeat] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!isEmail(email)) {
      return setError(L('Почта выглядит неправильно.', 'Пошта дұрыс емес сияқты.'))
    }
    if (password.length < 6) {
      return setError(L('Пароль должен быть хотя бы из шести символов.', 'Құпия сөз кемінде алты таңбадан тұруы керек.'))
    }
    if (mode !== 'signIn' && password !== repeat) {
      return setError(L('Пароли не совпадают.', 'Құпия сөздер сәйкес келмейді.'))
    }
    if (mode === 'signUp' && firstName.trim().length < 2) {
      return setError(L('Напиши имя, чтобы приложение знало, как к тебе обращаться.', 'Қосымша саған қалай жүгінетінін білуі үшін атыңды жаз.'))
    }
    setBusy(true)
    const fail =
      mode === 'signIn'
        ? await signIn(email, password)
        : mode === 'signUp'
          ? await signUp({ email, password, firstName, lastName })
          : await resetPassword(email, password)
    setBusy(false)
    if (fail) setError(fail)
  }

  const tabs: { id: Mode; label: string; labelKk: string }[] = [
    { id: 'signIn', label: 'Вход', labelKk: 'Кіру' },
    { id: 'signUp', label: 'Регистрация', labelKk: 'Тіркелу' },
    { id: 'reset', label: 'Забыл пароль', labelKk: 'Құпия сөзді ұмыттым' },
  ]

  return (
    <Card className="p-5">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setMode(t.id); setError(null) }}
            aria-pressed={mode === t.id}
            className={`h-9 rounded-full border px-3.5 text-[13px] font-semibold transition-colors ${
              mode === t.id
                ? 'border-brand-500 bg-brand-50 text-brand-900'
                : 'border-line bg-surface text-ink-soft hover:border-brand-300'
            }`}
          >
            {L(t.label, t.labelKk)}
          </button>
        ))}
      </div>

      {mode === 'reset' && (
        <p className="mt-4 rounded-xl bg-paper px-3.5 py-3 text-[13.5px] leading-relaxed text-ink-soft">
          {L(
            'Письмо со ссылкой отправить неоткуда: у прототипа нет сервера, и все данные лежат только в этом браузере. Поэтому пароль меняется прямо здесь — введи почту, с которой регистрировался, и новый пароль. Анкета и прогресс по плану при этом останутся на месте.',
            'Сілтемесі бар хатты жіберетін жер жоқ: прототипте сервер жоқ, барлық дерек тек осы браузерде сақталады. Сондықтан құпия сөз осы жерде ауысады — тіркелген поштаңды және жаңа құпия сөзді енгіз. Сауалнама мен жоспар бойынша прогресс орнында қалады.',
          )}
        </p>
      )}

      <form onSubmit={submit} className="mt-4 space-y-3">
        {mode === 'signUp' && (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={L('Имя', 'Аты')} value={firstName} onChange={setFirstName} autoComplete="given-name" placeholder={L('Аружан', 'Аружан')} />
            <Field label={L('Фамилия', 'Тегі')} value={lastName} onChange={setLastName} autoComplete="family-name" placeholder={L('Ярмоленко', 'Ярмоленко')} />
          </div>
        )}
        <Field label={L('Почта', 'Пошта')} type="email" value={email} onChange={setEmail} autoComplete="email" placeholder="aruzhan@example.com" />
        <Field
          label={mode === 'reset' ? L('Новый пароль', 'Жаңа құпия сөз') : L('Пароль', 'Құпия сөз')}
          type="password"
          value={password}
          onChange={setPassword}
          autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'}
          placeholder={L('не меньше шести символов', 'кемінде алты таңба')}
        />
        {mode !== 'signIn' && (
          <Field
            label={L('Ещё раз', 'Тағы бір рет')}
            type="password"
            value={repeat}
            onChange={setRepeat}
            autoComplete="new-password"
          />
        )}

        {error && (
          <p className="rounded-xl border border-coral-100 bg-coral-50 px-3.5 py-2.5 text-[13.5px] font-semibold text-coral-700">
            {error}
          </p>
        )}

        <Button type="submit" full size="lg" disabled={busy}>
          {mode === 'signIn' ? L('Войти', 'Кіру') : mode === 'signUp' ? L('Создать аккаунт', 'Аккаунт жасау') : L('Сменить пароль', 'Құпия сөзді ауыстыру')}
        </Button>
      </form>

      <DemoNote className="mt-4">
        {L(
          'Аккаунт хранится только в этом браузере: пароль не уходит в сеть, но и на другом устройстве его не будет. Синхронизация появится вместе с сервером.',
          'Аккаунт тек осы браузерде сақталады: құпия сөз желіге кетпейді, бірақ басқа құрылғыда да болмайды. Синхрондау сервермен бірге пайда болады.',
        )}
      </DemoNote>
    </Card>
  )
}

/** Карточка вошедшего человека: имя, год рождения, аватар. */
function Profile() {
  const L = useL()
  const navigate = useNavigate()
  const { account, updateAccount, signOut, deleteAccount } = useApp()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  if (!account) return null

  const currentYear = new Date().getFullYear()

  const pickAvatar = async (file: File | undefined) => {
    if (!file) return
    setError(null)
    try {
      updateAccount({ avatar: await readAvatar(file) })
    } catch {
      setError(L('Не удалось прочитать это изображение. Попробуй другой файл.', 'Бұл суретті оқу мүмкін болмады. Басқа файлды көр.'))
    }
  }

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex flex-wrap items-center gap-4">
          {account.avatar ? (
            <img
              src={account.avatar}
              alt=""
              className="h-20 w-20 shrink-0 rounded-full border border-line object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-brand-600 text-[24px] font-extrabold text-white"
            >
              {initials(account)}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-[19px] font-extrabold leading-tight">
              {[account.firstName, account.lastName].filter(Boolean).join(' ') || account.email}
            </h2>
            <p className="mt-0.5 text-[14px] text-ink-muted">{account.email}</p>
            <label className="mt-2 inline-block cursor-pointer text-[13px] font-semibold text-brand-700 underline underline-offset-2">
              {account.avatar ? L('Поменять фото', 'Фотоны ауыстыру') : L('Загрузить фото', 'Фото жүктеу')}
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => pickAvatar(e.target.files?.[0])}
              />
            </label>
            {account.avatar && (
              <button
                type="button"
                onClick={() => updateAccount({ avatar: undefined })}
                className="ml-3 text-[13px] font-semibold text-ink-muted underline underline-offset-2"
              >
                {L('Убрать', 'Алып тастау')}
              </button>
            )}
          </div>
        </div>

        {error && <p className="mt-3 text-[13.5px] font-semibold text-coral-700">{error}</p>}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <Field label={L('Имя', 'Аты')} value={account.firstName} onChange={(v) => updateAccount({ firstName: v })} />
          <Field label={L('Фамилия', 'Тегі')} value={account.lastName} onChange={(v) => updateAccount({ lastName: v })} />
          <label className="block">
            <span className="text-sm font-semibold">{L('Год рождения', 'Туған жылы')}</span>
            <input
              type="number"
              min={currentYear - 60}
              max={currentYear - 10}
              value={account.birthYear ?? ''}
              placeholder="2008"
              onChange={(e) => {
                const raw = e.target.value
                updateAccount({ birthYear: raw === '' ? undefined : Number(raw) })
              }}
              className="mt-1.5 h-11 w-full rounded-xl border border-line bg-surface px-3.5 text-[15px] tabular-nums transition-colors placeholder:text-ink-muted focus:border-brand-400"
            />
          </label>
        </div>

        <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">
          {L(
            'Имя и фото нужны только интерфейсу: подбор программ они не меняют — он считается по анкете.',
            'Аты мен фото тек интерфейске керек: бағдарлама таңдауын олар өзгертпейді — ол сауалнама бойынша есептеледі.',
          )}
        </p>
      </Card>

      <Card className="p-5">
        <p className="label mb-2">{L('Аккаунт', 'Аккаунт')}</p>
        <div className="flex flex-wrap gap-2.5">
          <Button variant="secondary" onClick={() => navigate('/survey')}>
            {L('Изменить анкету', 'Сауалнаманы өзгерту')}
          </Button>
          <Button variant="secondary" onClick={signOut}>
            {L('Выйти', 'Шығу')}
          </Button>
          {confirmDelete ? (
            <Button
              variant="secondary"
              onClick={() => { deleteAccount(); setConfirmDelete(false) }}
              className="border-coral-200 text-coral-700"
            >
              {L('Точно удалить аккаунт', 'Аккаунтты нақты жою')}
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => setConfirmDelete(true)}>
              {L('Удалить аккаунт', 'Аккаунтты жою')}
            </Button>
          )}
        </div>
        {confirmDelete && (
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-soft">
            {L(
              'Аккаунт исчезнет вместе с фото и паролем. Анкета и план останутся: они хранятся отдельно.',
              'Аккаунт фотосымен және құпия сөзімен бірге жойылады. Сауалнама мен жоспар қалады: олар бөлек сақталады.',
            )}
          </p>
        )}
      </Card>
    </div>
  )
}

export function Account() {
  const L = useL()
  const { account } = useApp()

  return (
    <div className="animate-fade-up space-y-5">
      <SectionTitle
        eyebrow={L('Аккаунт', 'Аккаунт')}
        title={account ? L('Твой профиль', 'Сенің профилің') : L('Вход в Qadam', 'Qadam-ға кіру')}
        description={
          account
            ? L('Имя, фото и год рождения. Всё хранится в этом браузере.', 'Аты, фото және туған жылы. Барлығы осы браузерде сақталады.')
            : L('Аккаунт нужен, чтобы приложение обращалось к тебе по имени. Пройти маршрут можно и без него.', 'Аккаунт қосымша саған атыңмен жүгінуі үшін керек. Маршрутты онсыз да өтуге болады.')
        }
        action={<Badge tone="brand">{L('Пока без сервера', 'Әзірге серверсіз')}</Badge>}
      />
      {account ? <Profile /> : <AuthForms />}
    </div>
  )
}
