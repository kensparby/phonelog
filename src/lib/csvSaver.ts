// Minimal CSV appender with File System Access API fallback
// - tries to store a per-day file handle in IndexedDB
// - appends a row to the file when possible
// - otherwise falls back to triggering a download of the day's CSV

function escapeCsv(value: string) {
  if (value == null) return ''
  const v = String(value)
  if (/[",\n\r]/.test(v)) {
    return '"' + v.replace(/"/g, '""') + '"'
  }
  return v
}

function formatDateKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function openHandlesDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('phonelog-file-handles', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('handles')) db.createObjectStore('handles')
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function getHandle(dateKey: string) {
  try {
    const db = await openHandlesDB()
    return new Promise<any>((resolve, reject) => {
      const tx = db.transaction('handles', 'readonly')
      const store = tx.objectStore('handles')
      const r = store.get(dateKey)
      r.onsuccess = () => resolve(r.result)
      r.onerror = () => reject(r.error)
    })
  } catch (e) {
    return undefined
  }
}

async function setHandle(dateKey: string, handle: any) {
  try {
    const db = await openHandlesDB()
    return new Promise<void>((resolve, reject) => {
      const tx = db.transaction('handles', 'readwrite')
      const store = tx.objectStore('handles')
      const r = store.put(handle, dateKey)
      r.onsuccess = () => resolve()
      r.onerror = () => reject(r.error)
    })
  } catch (e) {
    // ignore
  }
}

export async function appendRowToDailyCsv(keys: string[], rowValues: string[]) {
  const dateKey = formatDateKey()
  const filename = `${dateKey}.csv`
  const headerLine = keys.map(escapeCsv).join(',')
  const rowLine = rowValues.map(escapeCsv).join(',')
  const content = rowLine + '\n'

  // Try File System Access API
  try {
    const hasPicker = typeof (window as any).showSaveFilePicker === 'function'
    if (!hasPicker) throw new Error('No file picker')

    let handle = await getHandle(dateKey)
    if (!handle) {
      // Ask user to create or select today's CSV file
      const opts = {
        suggestedName: filename,
        types: [
          {
            description: 'CSV',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
      }
      // showSaveFilePicker may require user gesture; this is called from user action (addToLog)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      handle = await (window as any).showSaveFilePicker(opts)
      if (handle) await setHandle(dateKey, handle)
    }

    if (!handle) throw new Error('No handle')

    // Get current file size to seek to end
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const file = await handle.getFile()
    const size = file.size

    // If new/empty file, write header first
    const hasHeader = size > 0

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const writable = await handle.createWritable({ keepExistingData: true })
    try {
      if (size > 0) {
        await writable.seek(size)
      }
      if (!hasHeader) {
        await writable.write(headerLine + '\n')
      }
      await writable.write(content)
    } finally {
      await writable.close()
    }

    return { success: true, filename }
  } catch (e) {
    // Fallback: prompt download of today's CSV containing just this row appended to header
    try {
      const csv = keys.map(escapeCsv).join(',') + '\n' + rowLine + '\n'
      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      return { success: true, filename }
    } catch (inner) {
      return { success: false }
    }
  }
}

export default { appendRowToDailyCsv }
