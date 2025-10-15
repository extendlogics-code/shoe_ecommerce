import { IconArrowUpRight } from "@tabler/icons-react";
import { storyCards } from "../data/stories";

const StoryGrid = () => {
  return (
    <section className="section stories" id="stories">
      <div className="inner stack">
        <header className="section-heading">
          <span className="eyebrow">Editorial</span>
          <h2 className="section-heading__title">Stories from the studio</h2>
        </header>
        <div className="stories__grid">
          {storyCards.map((story) => (
            <article key={story.id} className="stories__card">
              <figure>
                <img src={story.image} alt={story.title} loading="lazy" />
              </figure>
              <div className="stories__body">
                <span>{story.tag}</span>
                <h3>{story.title}</h3>
                <p>{story.excerpt}</p>
                <a href={story.href}>
                  Read story
                  <IconArrowUpRight size={16} stroke={1.8} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StoryGrid;
