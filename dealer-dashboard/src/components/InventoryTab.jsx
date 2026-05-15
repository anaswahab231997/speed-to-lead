import { useState, useEffect } from 'react'
import { getInventory, addCar, updateCar, markSold } from '../api'
import UploadModal from './UploadModal'
import InventorySpotlight from './InventorySpotlight'

const BLANK = { name: '', year: '', make: '', model: '', colour: '', price: '', mileage: '', condition: 'Excellent', description: '' }
const CONDITIONS = ['Excellent', 'Good', 'Fair']

function CondBadge({ c }) {
  const cls = c === 'Excellent' ? 'excellent' : c === 'Good' ? 'good' : 'fair'
  return <span className={`cond-badge cond-${cls}`}>{c}</span>
}

function CarModal({ car, onClose, onSaved }) {
  const [form, setForm] = useState(car || BLANK)
  const [saving, setSaving] = useState(false)
  const isEdit = !!car?.id

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    if (!form.name || !form.price || !form.mileage) return alert('Please fill in Car Name, Price and Mileage.')
    setSaving(true)
    const payload = { ...form, price: Number(form.price), mileage: Number(form.mileage), year: Number(form.year) || undefined }
    if (isEdit) {
      await updateCar(car.id, payload)
    } else {
      await addCar(payload)
    }
    setSaving(false)
    onSaved()
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-handle" />
        <div className="modal-header">
          <span className="modal-title">{isEdit ? 'Edit Car' : '🚗 Add New Car'}</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="form">
          <div className="form-group">
            <label>Car Name *</label>
            <input placeholder="e.g. Toyota Land Cruiser 2021" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Make</label>
              <input placeholder="Toyota" value={form.make} onChange={e => set('make', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Year</label>
              <input type="number" placeholder="2021" value={form.year} onChange={e => set('year', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Price (AED) *</label>
              <input type="number" placeholder="145000" value={form.price} onChange={e => set('price', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Mileage (KM) *</label>
              <input type="number" placeholder="78000" value={form.mileage} onChange={e => set('mileage', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Colour</label>
              <input placeholder="Silver" value={form.colour} onChange={e => set('colour', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Condition</label>
              <select value={form.condition} onChange={e => set('condition', e.target.value)}>
                {CONDITIONS.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea placeholder="Single owner, service history available, no accidents..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : '+ Add to Inventory'}
          </button>
        </div>
      </div>
    </div>
  )
}

function SoldConfirm({ car, onConfirm, onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ borderRadius: '20px 20px 0 0' }}>
        <div className="modal-handle" />
        <div style={{ padding: '1.5rem 1.25rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>🏁</div>
          <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.5rem' }}>Mark as Sold?</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            <strong>{car.name}</strong> will be removed from active inventory.
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>Cancel</button>
            <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={onConfirm}>Mark as Sold</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InventoryTab() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [soldConfirm, setSoldConfirm] = useState(null)
  const [showUpload, setShowUpload] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await getInventory()
    if (res.success) setCars(res.data.filter(c => c.available))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleSold = async () => {
    await markSold(soldConfirm.id)
    setSoldConfirm(null)
    load()
  }

  const available = cars.filter(c => c.available)

  return (
    <div className="page">
      {!loading && <InventorySpotlight />}
      {/* Action buttons */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
        <button className="btn btn-primary" style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '0.92rem', borderRadius: 10 }} onClick={() => setModal('add')}>
          + Add Car
        </button>
        <button className="btn btn-ghost" style={{ justifyContent: 'center', padding: '0.9rem', fontSize: '0.92rem', borderRadius: 10, borderColor: 'var(--accent)', color: 'var(--accent)' }} onClick={() => setShowUpload(true)}>
          📂 Upload File
        </button>
      </div>

      <div className="card">
        <div className="section-head">
          <span className="section-title">🚗 Current Stock</span>
          <span className="section-count">{available.length} cars available</span>
        </div>

        {loading ? <div className="spinner" /> :
         available.length === 0 ? (
          <div className="empty">
            <div className="empty-icon">🚗</div>
            <div className="empty-title">No cars in stock</div>
            <div className="empty-sub">Tap the button above to add your first car</div>
          </div>
        ) : (
          <div className="inventory-stock-container">
            {available.map(car => (
              <div key={car.id} className="car-row" onClick={() => setModal(car)}>
                <span className="car-dot car-dot-avail" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="car-name">{car.name}</div>
                  <div className="car-detail">{car.colour} · {car.mileage?.toLocaleString()} km</div>
                </div>
                <CondBadge c={car.condition} />
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div className="car-price">AED {car.price?.toLocaleString()}</div>
                </div>
                <button
                  className="btn btn-danger"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
                  onClick={e => { e.stopPropagation(); setSoldConfirm(car) }}
                >
                  Sold
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {modal && (
        <CarModal
          car={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}
      {soldConfirm && (
        <SoldConfirm
          car={soldConfirm}
          onConfirm={handleSold}
          onClose={() => setSoldConfirm(null)}
        />
      )}
      {showUpload && (
        <UploadModal
          onClose={() => setShowUpload(false)}
          onImported={load}
        />
      )}
    </div>
  )
}
