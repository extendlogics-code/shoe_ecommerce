import { IconCash, IconLeaf, IconTruck } from "@tabler/icons-react";

const highlights = [
  {
    id: "shipping",
    icon: <IconTruck size={20} stroke={1.8} />,
    title: "Priority dispatch",
    subtitle: "Same-day shipping from bonded warehouse."
  },
  {
    id: "returns",
    icon: <IconCash size={20} stroke={1.8} />,
    title: "Risk-free try on",
    subtitle: "Easy returns within 90 days with instant refund."
  },
  {
    id: "materials",
    icon: <IconLeaf size={20} stroke={1.8} />,
    title: "Responsibly sourced",
    subtitle: "Certified leather & recycled performance knits."
  }
];

const HighlightsBar = () => {
  return (
    <section className="section highlights">
      <div className="inner highlights__shell">
        {highlights.map((item) => (
          <article className="highlights__item" key={item.id}>
            <div className="highlights__icon">{item.icon}</div>
            <div>
              <h3>{item.title}</h3>
              <p>{item.subtitle}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default HighlightsBar;
