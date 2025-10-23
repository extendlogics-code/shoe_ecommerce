import { useEffect, useMemo, useState } from "react";
import { IconMenu2, IconSearch, IconShoppingBag, IconUser, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { primaryNav } from "../data/navigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useCart } from "../context/CartContext";
import { DEFAULT_CATEGORY_ID, withCategoryPresentation } from "../data/categoryMeta";

type ApiCategorySummary = {
  id: string;
  label: string;
  navLabel: string;
  description: string;
  sortOrder: number;
  total: number;
};

type NavItem = {
  label: string;
  path: string;
  accent?: boolean;
  categoryId?: string;
};

const DEFAULT_CATEGORIES: ApiCategorySummary[] = [
  { id: "womens", label: "Women", navLabel: "Women", description: "", sortOrder: 10, total: 0 },
  { id: "mens", label: "Men", navLabel: "Men", description: "", sortOrder: 20, total: 0 },
  { id: "kids", label: "Kids", navLabel: "Kids", description: "", sortOrder: 30, total: 0 }
];

const buildCategoryNavItems = (categories: ApiCategorySummary[]): NavItem[] => {
  return categories
    .map((category) => ({ category, presentation: withCategoryPresentation(category) }))
    .filter(({ presentation }) => presentation.id !== DEFAULT_CATEGORY_ID)
    .sort((a, b) => {
      if (a.category.sortOrder !== b.category.sortOrder) {
        return a.category.sortOrder - b.category.sortOrder;
      }
      return a.presentation.label.localeCompare(b.presentation.label);
    })
    .map(({ category, presentation }) => ({
      label: presentation.navLabel,
      path: `/products?category=${presentation.id}`,
      categoryId: presentation.id
    }));
};

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoryNav, setCategoryNav] = useState<NavItem[]>(() => buildCategoryNavItems(DEFAULT_CATEGORIES));
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const response = await fetch("/api/products/categories");
        if (!response.ok) {
          if (!cancelled) {
            setCategoryNav(buildCategoryNavItems(DEFAULT_CATEGORIES));
          }
          return;
        }

        const data = (await response.json()) as ApiCategorySummary[];
        if (cancelled) {
          return;
        }

        const filtered = data.filter((category) => category.id && category.id !== DEFAULT_CATEGORY_ID);
        setCategoryNav(buildCategoryNavItems(filtered));
      } catch {
        if (!cancelled) {
          setCategoryNav(buildCategoryNavItems(DEFAULT_CATEGORIES));
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const navItems = useMemo(
    () =>
      primaryNav.reduce<NavItem[]>((acc, item, index) => {
        const mapped: NavItem = {
          label: item.label,
          accent: item.accent,
          categoryId: item.categoryId,
          path: item.path ?? (item.categoryId ? `/products?category=${item.categoryId}` : "/products")
        };

        if (index === 0) {
          acc.push(mapped, ...categoryNav);
        } else {
          acc.push(mapped);
        }
        return acc;
      }, []),
    [categoryNav]
  );

  const handleNavClick = (path: string) => {
    setIsMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="header">
      <div className="header__bar">
        <button
          className="header__menu-toggle"
          type="button"
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          {isMenuOpen ? <IconX size={20} stroke={1.8} /> : <IconMenu2 size={20} stroke={1.8} />}
        </button>

        <Link to="/" className="header__brand" onClick={() => setIsMenuOpen(false)}>
          <span className="header__brand-mark">Kalaa</span>
          <span className="header__brand-tagline">Crafted Footwear</span>
        </Link>

        <nav className="header__primary">
          {navItems.map((item) => {
            const isProductsPath = item.path.startsWith("/products");
            const isActive =
              item.path === "/"
                ? location.pathname === "/"
                : isProductsPath
                ? location.pathname === "/products" &&
                  (item.categoryId ? location.search.includes(`category=${item.categoryId}`) : true)
                : location.pathname === item.path;

            return (
              <button
                key={item.label}
                type="button"
                className={clsx("header__nav-link", item.accent && "header__nav-link--accent", isActive && "is-active")}
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="header__actions">
          <button type="button" className="header__icon-btn" aria-label="Search Kalaa shoes">
            <IconSearch size={20} stroke={1.8} />
          </button>
          <button
            type="button"
            className="header__icon-btn"
            aria-label="Account"
            onClick={() => {
              setIsMenuOpen(false);
              navigate("/admin/login");
            }}
          >
            <IconUser size={20} stroke={1.8} />
          </button>
          <Link to="/cart" className="header__bag" aria-label="Shopping bag" onClick={() => setIsMenuOpen(false)}>
            <IconShoppingBag size={20} stroke={1.8} />
            <span>{totalItems}</span>
          </Link>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.nav
            className="header__mobile"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24 }}
          >
            {navItems.map((item) => (
              <button
                key={item.label}
                type="button"
                className={clsx("header__mobile-link", item.accent && "header__mobile-link--accent")}
                onClick={() => handleNavClick(item.path)}
              >
                {item.label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
