import storyImageOne from "./home7-product4-1.jpg";
import storyImageTwo from "./home7-product5.jpg";
import storyImageThree from "./home7-product6-1.jpg";

export type StoryCard = {
  id: string;
  tag: string;
  title: string;
  excerpt: string;
  image: string;
  href: string;
};

export const storyCards: StoryCard[] = [
  {
    id: "craft",
    tag: "Behind the Craft",
    title: "Tracing every stitch back to the artisan.",
    excerpt: "Meet the makers shaping the Kalaa signature finish in our Florence studio.",
    image: storyImageOne,
    href: "#story-craft"
  },
  {
    id: "materials",
    tag: "Material Insight",
    title: "Sustainable hides, zero compromise.",
    excerpt:
      "How we upgraded our sourcing to regenerative farms while elevating softness and durability.",
    image: storyImageTwo,
    href: "#story-materials"
  },
  {
    id: "design",
    tag: "Design Lab",
    title: "Concept to collection in 90 days.",
    excerpt:
      "Inside the rapid prototyping sprint that turned sketches into our best-selling runner.",
    image: storyImageThree,
    href: "#story-design"
  }
];
