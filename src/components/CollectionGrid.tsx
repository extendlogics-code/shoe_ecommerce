import { motion } from "framer-motion";
import type { CollectionCard } from "../data/products";

type Props = {
  cards: CollectionCard[];
};

const CollectionGrid = ({ cards }: Props) => {
  return (
    <section className="section" id="collections">
      <div className="inner stack">
        <header className="section-heading">
          <span className="eyebrow">Collections</span>
          <h2 className="section-heading__title">Curated edits, built for movement</h2>
        </header>
        <div className="collection-grid">
          {cards.map((card) => (
            <motion.article
              key={card.id}
              className="collection-card"
              whileHover={{ y: -6 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <figure className="collection-card__media">
                <img src={card.image} alt={card.title} loading="lazy" />
              </figure>
              <div className="collection-card__body" data-tone={card.tone}>
                <h3>{card.title}</h3>
                <p>{card.blurb}</p>
                <a href={card.href}>Shop Collection</a>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CollectionGrid;
