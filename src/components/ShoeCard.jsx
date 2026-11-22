import { formatRupiah } from '../data/shoes.js'

function ShoeCard({ shoe, onSelect }) {
  return (
    <article className="kick-card" onClick={() => onSelect(shoe)}>
      <div className="kick-card-image-wrap">
        <img
          src={shoe.image || '/shoes/dunk-low.svg'}
          alt={shoe.name}
          className="kick-card-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null
            e.target.src = '/shoes/dunk-low.svg'
          }}
        />

        {/* Top Badges */}
        <div className="kick-card-badges">
          <span className="badge-authentic">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Authentic
          </span>

          {shoe.isExpress ? (
            <span className="badge-express" title="Pengiriman Ekspres 1-2 Hari">
              ⚡ Express
            </span>
          ) : (
            <span className="badge-standard" title="Pengiriman Standar 3-5 Hari">
              📦 Standard
            </span>
          )}
        </div>

        <span className="kick-condition-pill">{shoe.condition.split(' ')[0]}</span>

        {/* Multi-Photo Counter Badge if shoe has multiple detail photos */}
        {shoe.images && shoe.images.length > 1 && (
          <span className="badge-photos-count" title={`${shoe.images.length} foto detail tersedia`}>
            📷 {shoe.images.length} Foto
          </span>
        )}
      </div>

      <div className="kick-card-body">
        <div className="kick-card-meta">
          <span className="kick-brand-name">{shoe.brand.toUpperCase()}</span>
          <span className="kick-size-tag">{shoe.size}</span>
        </div>

        <h3 className="kick-card-title">{shoe.name}</h3>

        <div className="kick-price-section">
          <span className="kick-price-label">Start from</span>
          <div className="kick-price-value">{formatRupiah(shoe.price)}</div>
        </div>
      </div>
    </article>
  )
}

export default ShoeCard
