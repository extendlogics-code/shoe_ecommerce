const partners = [
  "Vogue",
  "GQ",
  "Harper's Bazaar",
  "Highsnobiety",
  "Hypebeast",
  "Monocle",
  "Elle"
];

const BrandTicker = () => {
  return (
    <section className="section brand-ticker">
      <div className="inner brand-ticker__shell">
        <span className="eyebrow">As seen in</span>
        <div className="brand-ticker__list" aria-hidden="true">
          {[...partners, ...partners].map((partner, index) => (
            <span key={`${partner}-${index}`} className="brand-ticker__item">
              {partner}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandTicker;
