import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div>
          <div className="footer-brand-name">🍽️ Har Kunli Menyu</div>
          <p className="footer-brand-desc">
            50 dan ortiq Shirinlik retseptlari. Uyda professional darajada Shirinlik Tayyorlangshni o'rganing.
            Rasm darslar, bosqichma-bosqich ko'rsatmalar.
          </p>
          <div className="footer-social" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="https://www.instagram.com/har_kunli_menyu/" target="_blank" rel="noopener noreferrer" title="Instagram" style={{ color: 'inherit', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
              </svg>
            </a>
            <a href="https://t.me/HarKunliMenyuBot" target="_blank" rel="noopener noreferrer" title="Telegram" style={{ color: 'inherit', display: 'flex' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </a>
          </div>
        </div>

        {/* Links */}
        <div>
          <p className="footer-heading">Sahifalar</p>
          <ul className="footer-links">
            <li><Link to="/">Bosh sahifa</Link></li>
            <li><a href="#courses">Kurslar</a></li>
            <li><a href="#features">Afzalliklar</a></li>
            <li><Link to="/profile">Profilim</Link></li>
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="footer-heading">Aloqa</p>
          <ul className="footer-links">
            <li><a href="https://www.instagram.com/har_kunli_menyu/" target="_blank" rel="noopener noreferrer">Instagram</a></li>
            <li><a href="https://t.me/HarKunliMenyuBot" target="_blank" rel="noopener noreferrer">Telegram bot</a></li>
            <li><a href="mailto:info@harkunlimenyu.uz">Email</a></li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Har Kunli Menyu. Barcha huquqlar himoyalangan.</p>
      </div>
    </footer>
  )
}
