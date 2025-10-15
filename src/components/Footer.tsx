import { IconBrandInstagram, IconBrandPinterest, IconBrandTiktok } from "@tabler/icons-react";

const footNav = [
  {
    title: "Shop",
    links: ["Women", "Men", "Kids", "Limited Editions", "Gift Cards"]
  },
  {
    title: "About",
    links: ["Our Story", "Material Innovation", "Sustainability", "Careers"]
  },
  {
    title: "Support",
    links: ["Contact", "Shipping", "Returns", "Size Guide", "FAQ"]
  }
];

const Footer = () => {
  return (
    <footer className="section footer">
      <div className="inner footer__shell">
        <div className="footer__brand">
          <span className="footer__brand-mark">Kalaa</span>
          <p>
            Designing future-classics for movement, expression, and everyday luxury. Made in
            ateliers across Italy and Portugal.
          </p>
          <div className="footer__social">
            <a href="https://instagram.com" aria-label="Kalaa on Instagram">
              <IconBrandInstagram size={18} stroke={1.8} />
            </a>
            <a href="https://pinterest.com" aria-label="Kalaa on Pinterest">
              <IconBrandPinterest size={18} stroke={1.8} />
            </a>
            <a href="https://tiktok.com" aria-label="Kalaa on TikTok">
              <IconBrandTiktok size={18} stroke={1.8} />
            </a>
          </div>
        </div>

        <div className="footer__grid">
          {footNav.map((column) => (
            <nav key={column.title}>
              <h4>{column.title}</h4>
              {column.links.map((label) => (
                <a key={label} href={`#${label.toLowerCase().replace(/\s+/g, "-")}`}>
                  {label}
                </a>
              ))}
            </nav>
          ))}
        </div>
      </div>
      <div className="footer__bottom">
        <div className="inner footer__bottom-shell">
          <span>© {new Date().getFullYear()} Kalaa Crafts</span>
          <div className="footer__legal">
            <a href="#privacy">Privacy Policy</a>
            <a href="#terms">Terms</a>
            <a href="#cookies">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
