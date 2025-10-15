import { Link, useNavigate } from "react-router-dom";
import type { ChangeEvent } from "react";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";

const CartPage = () => {
  const { items, totalItems, subtotal, removeItem, updateQuantity } = useCart();
  const navigate = useNavigate();

  const handleQuantityChange = (id: string, event: ChangeEvent<HTMLInputElement>) => {
    const quantity = Number.parseInt(event.target.value, 10);
    if (Number.isNaN(quantity)) {
      return;
    }
    updateQuantity(id, Math.max(1, Math.min(quantity, 10)));
  };

  if (items.length === 0) {
    return (
      <main className="section cart-page" role="main">
        <div className="inner cart-page__shell">
          <h1>Your bag is empty</h1>
          <p>Discover something you love from Kalaa Shoes.</p>
          <Link to="/products" className="button button--primary">
            Explore Collections
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="section cart-page" role="main">
      <div className="inner cart-page__shell">
        <header className="cart-page__header">
          <div>
            <h1>Your bag</h1>
            <p>{totalItems} item{totalItems > 1 ? "s" : ""} ready for checkout.</p>
          </div>
          <Link to="/products" className="cart-page__continue">
            Continue shopping
          </Link>
        </header>

        <div className="cart-page__grid">
          <section className="cart-page__items">
            {items.map((item) => (
              <article key={item.id} className="cart-page__item surface">
                <Link to={`/products/${item.id}`} className="cart-page__item-media">
                  <img src={item.image} alt={item.name} />
                </Link>
                <div className="cart-page__item-body">
                  <div>
                    <Link to={`/products/${item.id}`}>
                      <h3>{item.name}</h3>
                    </Link>
                    <span>{formatCurrency(item.price)}</span>
                  </div>
                  <div className="cart-page__item-actions">
                    <label>
                      Qty
                      <input
                        type="number"
                        min={1}
                        max={10}
                        value={item.quantity}
                        onChange={(event) => handleQuantityChange(item.id, event)}
                      />
                    </label>
                    <button type="button" onClick={() => removeItem(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
                <div className="cart-page__item-total">{formatCurrency(item.price * item.quantity)}</div>
              </article>
            ))}
          </section>

          <aside className="cart-page__summary surface">
            <h2>Order summary</h2>
            <div>
              <div className="cart-page__summary-row">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="cart-page__summary-row">
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="cart-page__summary-row cart-page__summary-row--total">
                <span>Total</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
            </div>
            <button type="button" className="button button--primary" onClick={() => navigate("/checkout")}>
              Proceed to checkout
            </button>
          </aside>
        </div>
      </div>
    </main>
  );
};

export default CartPage;
