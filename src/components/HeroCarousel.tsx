import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { IconArrowRight } from "@tabler/icons-react";
import { heroSlides } from "../data/hero";
import { Link, useNavigate } from "react-router-dom";
import exclusiveThumb from "../data/home7-product3-1.jpg";

const AUTO_PLAY_MS = 6000;

const HeroCarousel = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const cycle = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % heroSlides.length);
    }, AUTO_PLAY_MS);

    return () => clearInterval(cycle);
  }, []);

  const activeSlide = heroSlides[activeIndex];

  return (
    <section className="section hero" id="hero">
      <div className="inner hero__shell">
        <div className="hero__content">
          <div className="hero__meta">
            {activeSlide.accentLabel && <span className="chip">{activeSlide.accentLabel}</span>}
            <div className="hero__exclusive">
              <img
                className="hero__exclusive-img"
                src={exclusiveThumb}
                alt="Artisan handcrafting a leather shoe"
              />
              <span className="eyebrow">Kalaa Exclusive</span>
            </div>
          </div>
          <h1 className="headline">{activeSlide.title}</h1>
          <p className="subhead">{activeSlide.subtitle}</p>
          <div className="hero__actions">
            <button
              type="button"
              className="button button--primary"
              onClick={() => navigate(activeSlide.ctaHref)}
            >
              {activeSlide.ctaLabel}
              <IconArrowRight size={18} stroke={1.8} />
            </button>
            <Link to="/products" className="button button--ghost">
              View Lookbook
            </Link>
          </div>

          <div className="hero__progress">
            {heroSlides.map((slide, index) => (
              <button
                key={slide.id}
                type="button"
                className="hero__progress-dot"
                data-active={index === activeIndex}
                aria-label={`Go to ${slide.title} slide`}
                onClick={() => setActiveIndex(index)}
              />
            ))}
          </div>
        </div>

        <div className="hero__media">
          <AnimatePresence mode="wait">
            <motion.img
              key={activeSlide.id}
              src={activeSlide.image}
              alt={activeSlide.title}
              initial={{ opacity: 0, scale: 1.02 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.6 }}
            />
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default HeroCarousel;
