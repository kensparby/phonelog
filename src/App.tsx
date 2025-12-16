import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import './App.css'
import { t } from '@/i18n'

// routing logic
type FieldKey = 'order' | 'article' | 'case' | 'customer' | 'name' | 'email' | 'phone'

function routeInput(key: string): FieldKey | null {
  // if (value.includes('@')) return 'email'
  // if (/^cs/i.test(value)) return 'case'
  // if (/^o/i.test(value)) return 'order'
  // if (/^a/i.test(value)) return 'article'
  // if (/^k/i.test(value)) return 'customer'
  // if (/^n/i.test(value)) return 'name'
  // if (/^t/i.test(alue)) return 'phone'
  if (key == 'F1') return 'order'
  if (key == 'F2') return 'case'
  if (key == 'F3') return 'article'
  if (key == 'F4') return 'customer'
  if (key == 'F5') return 'name'
  if (key == 'F6') return 'email'
  if (key == 'F7') return 'phone'

  return null
}

function stripPrefix(value: string) {
  // TODO: fix after adding more test cases in the routing logic
  if (value.includes('@')) return value.trim();
  return value.replace(/^(o|a|cs|k|n|t)/i, '').trim()
}

function App() {
  const mainInputRef = useRef<HTMLInputElement>(null)

  const [fields, setFields] = useState<Record<FieldKey, string[]>>({
    order: [],
    article: [],
    case: [],
    customer: [],
    name: [],
    email: [],
    phone: [],
  })

  const [log, setLog] = useState<Record<FieldKey, string[]>[]>([])
  const [copiedIds, setCopiedIds] = useState<string[]>([])
  const copyTimeouts = useRef<Record<string, number>>({})

  useEffect(() => {
    mainInputRef.current?.focus()
  }, [])

  // load persisted log from localStorage (16 hour lifetime)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('phonelog-log')
      if (!raw) return
      const parsed = JSON.parse(raw)
      const ts = parsed?.ts
      const entries = parsed?.log
      if (!ts || !entries) return
      const age = Date.now() - Number(ts)
      const maxAge = 16 * 60 * 60 * 1000 // 16 hours
      if (age < maxAge && Array.isArray(entries)) {
        setLog(entries)
      } else {
        localStorage.removeItem('phonelog-log')
      }
    } catch (e) {
      // ignore parse errors
    }
  }, [])

  function handleMainInput(value: string, key: string) {
    const fieldKey = routeInput(key)
    if (!fieldKey) return

    const val = stripPrefix(value)
    if (!val) return
    setFields(prev => ({
      ...prev,
      [fieldKey]: [...prev[fieldKey], val],
    }))
  }

  async function copyWithFeedback(id: string, value: string) {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedIds(prev => (prev.includes(id) ? prev : [id, ...prev]))
      // clear after 1.5s
      const t = window.setTimeout(() => {
        setCopiedIds(prev => prev.filter(x => x !== id))
        delete copyTimeouts.current[id]
      }, 1500)
      copyTimeouts.current[id] = t
    } catch (e) {
      // ignore clipboard errors for now
    }
  }

  function removeTagFromForm(key: FieldKey, index: number) {
    setFields(prev => ({
      ...prev,
      [key]: prev[key].filter((_, i) => i !== index),
    }))
  }

  function addToLog() {
    // Add a snapshot of current fields (arrays) to the top of the log and clear the form
    const newEntry = fields
    const newLog = [newEntry, ...log]
    setLog(newLog)

    // persist to localStorage with timestamp
    try {
      localStorage.setItem('phonelog-log', JSON.stringify({ ts: Date.now(), log: newLog }))
    } catch (e) {
      // ignore storage errors
    }

    setFields({ order: [], article: [], case: [], customer: [], name: [], email: [], phone: [] })
    mainInputRef.current?.focus()
  }

  // function removeTagFromLog(entryIdx: number, key: FieldKey, index: number) {
  //   setLog(prev => {
  //     const updated = prev.map((entry, idx) => {
  //       if (idx !== entryIdx) return entry
  //       return {
  //         ...entry,
  //         [key]: (entry as any)[key].filter((_: any, i: number) => i !== index),
  //       }
  //     })
  //     try {
  //       localStorage.setItem('phonelog-log', JSON.stringify({ ts: Date.now(), log: updated }))
  //     } catch (e) {
  //       // ignore
  //     }
  //     return updated
  //   })
  // }

  function escapeCsvCell(v: string) {
    if (v == null) return ''
    const s = String(v)
    if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
    return s
  }

  function downloadCsvAndMaybeClear() {
    const keys: string[] = ['order', 'article', 'case', 'customer', 'name', 'email', 'phone']
    const header = keys.map(escapeCsvCell).join(',')
    const rows = log.map(entry => {
      return keys
        .map(k => (entry as any)[k]?.join(' | ') ?? '')
        .map(escapeCsvCell)
        .join(',')
    })
    const csv = [header, ...rows].join('\n') + '\n'
    const blob = new Blob([csv], { type: 'text/csv' })
    const filename = `phonelog-${new Date().toISOString().slice(0, 10)}.csv`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    // prompt to clear log
    setTimeout(() => {
      if (window.confirm(t('downloadedCsvClearLog'))) {
        setLog([])
        try {
          localStorage.removeItem('phonelog-log')
        } catch (e) {
          // ignore
        }
      }
    }, 100)
  }

  useEffect(() => {
    return () => {
      // clear any pending timeouts on unmount
      Object.values(copyTimeouts.current).forEach(t => window.clearTimeout(t))
      copyTimeouts.current = {}
    }
  }, [])

  return (
    <div className="min-h-screen bg-background flex items-start justify-center p-6 min-w-3xl">
      <div className="w-full max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('callNotesRouter')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              ref={mainInputRef}
              placeholder={t('typeAndPressEnter')}
              onKeyDown={e => {
                e.preventDefault();
                handleMainInput(e.currentTarget.value, e.key);
                // if (e.key === 'Enter') {
                //   handleMainInput(e.currentTarget.value, e.key)
                //   e.currentTarget.value = ''
                // }
              }}
            />

            {/* Form - looks similar to a log row */}
            <div className="space-y-2">
              {(Object.keys(fields) as FieldKey[]).map(key => (
                <div key={key} className="flex gap-2 items-start">
                  <Label className="w-24 capitalize flex-shrink-0">{t(key)}:</Label>
                  <div className="flex-1 flex flex-wrap gap-2 items-center">
                    {fields[key].length === 0 ? (
                      <div className="text-sm dark:text-muted-foreground">—</div>
                    ) : (
                      fields[key].map((val, i) => (
                        <Button
                          key={i}
                          variant="outline"
                          size="sm"
                          onClick={() => copyWithFeedback(`form-${key}-${i}`, val)}
                          onContextMenu={e => {
                            e.preventDefault()
                            removeTagFromForm(key, i)
                          }}
                          className={`rounded-full dark:bg-slate-50! dark:text-sky-700! bg-sky-700! text-slate-50! ${copiedIds.includes(`form-${key}-${i}`) ? 'bg-green-100 border-green-200' : ''}`}>
                          {val}
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              ))}

              <div className="flex gap-2 justify-end">
                <Button
                  className={`dark:bg-slate-50! dark:text-sky-700! bg-sky-700! text-slate-50{!`}
                  onClick={() => setFields({ order: [], article: [], case: [], customer: [], name: [], email: [], phone: [] })}>
                  {t('clear')}
                </Button>
                <Button
                  className={`dark:bg-slate-50! dark:text-sky-700! bg-sky-700! text-slate-50!`}
                  onClick={addToLog}>{t('addToLog')}</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Log / spreadsheet */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{t('logMostRecentFirst')}</h3>
            <Button
              className={`dark:bg-slate-50! dark:text-sky-700! bg-sky-700! text-slate-50!`}
              onClick={downloadCsvAndMaybeClear}>{t('downloadLog')}</Button>
          </div>
          <div className="space-y-3">
            {log.length === 0 && <div className="text-sm text-muted-foreground">{t('noEntriesYet')}</div>}
            {log.map((entry, idx) => (
              <Card key={idx} className="p-3">
                <div className="flex gap-3 flex-wrap">
                  {(Object.keys(entry) as FieldKey[]).map(k => (
                    <div key={k} className="flex gap-2 items-start w-full md:w-1/3">
                      <Label className="w-20 capitalize flex-shrink-0">{t(k)}:</Label>
                      <div className="flex-1 flex flex-wrap gap-2 items-center">
                        {((entry as any)[k] ?? []).length === 0 ? (
                          <div className="text-sm text-muted-foreground">—</div>
                        ) : (
                          ((entry as any)[k] ?? []).map((val: string, i: number) => (
                            <Button
                              key={i}
                              type="button"
                              onClick={() => copyWithFeedback(`log-${idx}-${k}-${i}`, val)}
                              // onContextMenu={e => {
                              //   e.preventDefault()
                              //   removeTagFromLog(idx, k, i)
                              // }}
                              className={`rounded-full bg-slate-50! text-sky-700! dark:bg-sky-700! dark:text-slate-50! ${copiedIds.includes(`log-${idx}-${k}-${i}`) ? 'bg-green-100 border-green-200' : ''}`}>
                              {val}
                            </Button>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
