import { useMemo, useState } from "react";
import { IconMenu2, IconSearch, IconShoppingBag, IconUser, IconX } from "@tabler/icons-react";
import { motion, AnimatePresence } from "framer-motion";
import { primaryNav } from "../data/navigation";
import { Link, useLocation, useNavigate } from "react-router-dom";
import clsx from "clsx";
import { useCart } from "../context/CartContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { totalItems } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = useMemo(
    () =>
      primaryNav.map((item) => ({
        ...item,
        path: item.path ?? `/products?category=${item.categoryId ?? "women"}`
      })),
    []
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
