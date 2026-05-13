import { useState, useRef } from 'react'
import { API } from '../api'

const OUR_FIELDS = [
  { key: 'name',      label: 'Car Name',      required: true },
  { key: 'make',      label: 'Make (Brand)',   required: false },
  { key: 'model',     label: 'Model',          required: false },
  { key: 'year',      label: 'Year',           required: false },
  { key: 'price',     label: 'Price (AED)',    required: false },
  { key: 'mileage',   label: 'Mileage (KM)',   required: false },
  { key: 'colour',    label: 'Colour',         required: false },
  { key: 'condition', label: 'Condition',      required: false },
  { key: 'notes',     label: 'Notes',          required: false },
]

export default function UploadModal({ onClose, onImported }) {
  const [step, setStep] = useState('upload') // upload → preview → importing → done
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState('')
  const [parsed, setParsed] = useState(null)   // { headers, preview, mapping, total, filename }
  const [mapping, setMapping] = useState({})   // our field → spreadsheet header
  const [allRows, setAllRows] = useState([])
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  // ── Step 1: Upload file ──────────────────────────────────────────────────────
  const handleFile = async (file) => {
    if (!file) return
    setError('')
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await fetch(`${API}/inventory/parse`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.success) { setError(data.error); return }
      setParsed(data)
      setMapping(data.mapping)
      // Store all rows for later import
      const fd2 = new FormData(); fd2.append('file', file)
      const res2 = await fetch(`${API}/inventory/parse`, { method: 'POST', body: fd2 })
      const full = await res2.json()
      setAllRows(full.rows || [])
      setStep('preview')
    } catch (e) {
      setError('Could not read file. Please try again.')
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── Step 2: Confirm mapping ──────────────────────────────────────────────────
  const setMap = (field, col) => setMapping(m => ({ ...m, [field]: col }))

  // ── Step 3: Import ───────────────────────────────────────────────────────────
  const doImport = async () => {
    setStep('importing')
    try {
      const res = await fetch(`${API}/inventory/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: allRows, mapping })
      })
      const data = await res.json()
      setResult(data)
      setStep('done')
    } catch {
      setError('Import failed. Please try again.')
      setStep('preview')
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxHeight: '90vh', borderRadius: window.innerWidth > 640 ? 16 : '20px 20px 0 0' }}>
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">
            {step === 'upload' && '📂 Upload Inventory File'}
            {step === 'preview' && '🔍 Check Your Columns'}
            {step === 'importing' && '⏳ Importing…'}
            {step === 'done' && '✅ Import Complete'}
          </span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* ── STEP 1: Upload ── */}
        {step === 'upload' && (
          <div style={{ padding: '1.5rem 1.25rem' }}>
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
              onClick={() => fileRef.current.click()}
              style={{
                border: `2px dashed ${dragging ? 'var(--accent)' : 'var(--border)'}`,
                borderRadius: 12, padding: '2.5rem 1.5rem', textAlign: 'center',
                cursor: 'pointer', transition: 'all 0.15s',
                background: dragging ? 'var(--accent-light)' : 'var(--bg)',
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📄</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.4rem' }}>
                Drop your file here, or tap to browse
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Excel (.xlsx, .xls) · CSV · OpenDocument (.ods)
              </div>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,.ods" style={{ display: 'none' }}
                onChange={e => handleFile(e.target.files[0])} />
            </div>

            {error && (
              <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'var(--hot-bg)', borderRadius: 8, color: 'var(--hot)', fontSize: '0.87rem', fontWeight: 500 }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ marginTop: '1.5rem', background: 'var(--bg)', borderRadius: 10, padding: '1rem' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.6rem' }}>💡 What format does my file need to be in?</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Any format works. The first row should be your column headers. Common headers we recognise automatically:
                <br />
                <strong style={{ color: 'var(--text)' }}>Car Name, Make, Model, Year, Price, Mileage/KM, Colour, Condition</strong>
                <br />
                Arabic column names also work.
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview + column mapping ── */}
        {step === 'preview' && parsed && (
          <>
            <div style={{ padding: '0.75rem 1.25rem', background: 'var(--success-bg)', borderBottom: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600 }}>
              ✓ {parsed.filename} — {parsed.total} cars detected
            </div>

            {/* Column mapping */}
            <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: '0.3rem' }}>Match your columns to our fields</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.9rem' }}>
                We've auto-detected most columns. Adjust any that look wrong.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {OUR_FIELDS.map(f => (
                  <div key={f.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: f.required ? 'var(--accent)' : 'var(--text-muted)' }}>
                      {f.label}{f.required ? ' *' : ''}
                    </label>
                    <select
                      value={mapping[f.key] || ''}
                      onChange={e => setMap(f.key, e.target.value)}
                      style={{ padding: '0.55rem 0.7rem', fontSize: '0.82rem' }}
                    >
                      <option value="">— skip —</option>
                      {parsed.headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview table */}
            <div style={{ padding: '0.75rem 1.25rem 0' }}>
              <div style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Preview (first {Math.min(parsed.preview.length, 5)} rows)</div>
              <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)', marginBottom: '0.75rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', minWidth: 400 }}>
                  <thead>
                    <tr style={{ background: 'var(--bg)' }}>
                      {OUR_FIELDS.filter(f => mapping[f.key]).map(f => (
                        <th key={f.key} style={{ padding: '0.5rem 0.75rem', fontWeight: 700, textAlign: 'left', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' }}>
                          {f.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsed.preview.slice(0, 5).map((row, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        {OUR_FIELDS.filter(f => mapping[f.key]).map(f => (
                          <td key={f.key} style={{ padding: '0.5rem 0.75rem', color: 'var(--text-muted)' }}>
                            {row[mapping[f.key]] || '—'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="form-actions">
              <button className="btn btn-ghost" onClick={() => setStep('upload')}>← Back</button>
              <button className="btn btn-primary" onClick={doImport} disabled={!mapping.name && !mapping.make}>
                Import {parsed.total} Cars →
              </button>
            </div>
          </>
        )}

        {/* ── STEP 3: Importing ── */}
        {step === 'importing' && (
          <div style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 1.5rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>Importing to Airtable…</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.4rem' }}>This may take a few seconds for large lists</div>
          </div>
        )}

        {/* ── STEP 4: Done ── */}
        {step === 'done' && result && (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem', marginBottom: '0.4rem' }}>
              {result.imported} cars added to inventory!
            </div>
            {result.failed > 0 && (
              <div style={{ color: 'var(--warm)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>
                {result.failed} rows could not be imported.
              </div>
            )}
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1.75rem' }}>
              Your inventory is live. Layla can now answer buyer questions about these cars.
            </div>
            <button className="btn btn-primary" style={{ padding: '0.75rem 2rem' }} onClick={() => { onImported(); onClose() }}>
              View Inventory
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
