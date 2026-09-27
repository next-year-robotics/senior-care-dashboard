import { errorKind, errorMessages, type ErrorKind } from '../lib/errors'

export function ErrorBanner({ errors = [], kind }: { errors?: (string | null)[]; kind?: ErrorKind }) {
  const messages = [...new Set([...errors.filter((e): e is string => !!e).map((e) => errorMessages[errorKind(e)]), ...(kind ? [errorMessages[kind]] : [])])]
  if (messages.length === 0) return null
  return <div role="alert" className="mb-4 space-y-2 rounded-lg bg-brand-error/10 p-3 text-brand-error">
    {messages.map((message) => <p key={message}>{message}</p>)}
  </div>
}
