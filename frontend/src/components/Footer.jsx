import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        {/* Brand */}
        <div>
          <div className="footer-brand-name">🍽️ Har Kunli Menyu</div>
          <p className="footer-brand-desc">
            50 dan ortiq taom retseptlari. Uyda professional darajada Shirinlik Tayyorlangshni o'rganing.
            Video darslar, bosqichma-bosqich ko'rsatmalar va shaxsiy maslahatlar.
          </p>
          <div className="footer-social">
            <a href="https://www.instagram.com/har_kunli_menyu/" target="_blank" rel="noopener noreferrer" title="Instagram">📸</a>
            <a href="https://t.me/HarKunliMenyuBot" target="_blank" rel="noopener noreferrer" title="Telegram">✈️</a>
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
