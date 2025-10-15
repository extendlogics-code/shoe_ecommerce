import { useMemo, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/currency";

type FormState = {
  fullName: string;
  addressLine: string;
  city: string;
  state: string;
  phone: string;
  email: string;
};

type FormErrors = Partial<Record<keyof FormState, string>>;

const initialForm: FormState = {
  fullName: "",
  addressLine: "",
  city: "",
  state: "",
  phone: "",
  email: ""
};

type PendingOrder = {
  id: string;
  form: FormState;
  items: {
    id: string;
    name: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
};

type OrderDetails = PendingOrder & {
  transactionId: string;
};

const CheckoutPage = () => {
  const navigate = useNavigate();
  const { items, subtotal, totalItems, clearCart } = useCart();
  const [form, setForm] = useState<FormState>(initialForm);
  const [errors, setErrors] = useState<FormErrors>({});
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionInput, setTransactionInput] = useState("");
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const taxEstimate = useMemo(() => Math.round(subtotal * 0.08 * 100) / 100, [subtotal]);
  const orderTotal = subtotal + taxEstimate;

  const validate = (): boolean => {
    const nextErrors: FormErrors = {};

    if (!form.fullName.trim()) {
      nextErrors.fullName = "Name is required.";
    }
    if (!form.addressLine.trim()) {
      nextErrors.addressLine = "Address is required.";
    }
    if (!form.city.trim()) {
      nextErrors.city = "City is required.";
    }
    if (!form.state.trim()) {
      nextErrors.state = "State is required.";
    }

    const phonePattern = /^[0-9+\-\s()]{7,}$/;
    if (!form.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    } else if (!phonePattern.test(form.phone.trim())) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!emailPattern.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) {
      return;
    }
    if (items.length === 0) {
      return;
    }

    const snapshot: PendingOrder = {
      id: `KALAA-${Date.now()}`,
      form,
      items: items.map((item) => ({
        id: item.id,
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      subtotal
    };

    setPendingOrder(snapshot);
    setTransactionInput("");
    setTransactionError(null);
    setTransactionModalOpen(true);
  };

  const handleCloseTransactionModal = () => {
    setTransactionModalOpen(false);
    setPendingOrder(null);
    setTransactionInput("");
    setTransactionError(null);
  };

  const handleConfirmTransaction = () => {
    if (!pendingOrder) {
      return;
    }
    if (!transactionInput.trim()) {
      setTransactionError("Transaction ID is required.");
      return;
    }

    const completedOrder: OrderDetails = {
      ...pendingOrder,
      transactionId: transactionInput.trim()
    };

    setOrderDetails(completedOrder);
    setPendingOrder(null);
    setTransactionModalOpen(false);
    setForm(initialForm);
    clearCart();
  };

  const handleTransactionInput = (event: ChangeEvent<HTMLInputElement>) => {
    setTransactionInput(event.target.value);
    setTransactionError(null);
  };

  if (orderDetails) {
    const confirmationTax = Math.round(orderDetails.subtotal * 0.08 * 100) / 100;
    return (
      <main className="section checkout-page" role="main">
        <div className="inner checkout-page__shell stack">
          <header className="checkout-page__confirmation surface">
            <span className="eyebrow">Order confirmed</span>
            <h1>Thank you, {orderDetails.form.fullName || "Kalaa friend"}!</h1>
            <p>
              Your transaction <strong>{orderDetails.transactionId}</strong> has been captured. Order{" "}
              <strong>{orderDetails.id}</strong> is being prepared for dispatch, and a confirmation email is on the way.
            </p>
          </header>

          <section className="checkout-page__summary surface">
            <h2>Order details</h2>
            <div className="checkout-page__summary-grid">
              <div>
                <h3>Shipping to</h3>
                <p>
                  {orderDetails.form.fullName}
                  <br />
                  {orderDetails.form.addressLine}
                  <br />
                  {orderDetails.form.city}, {orderDetails.form.state}
                  <br />
                  {orderDetails.form.phone}
                </p>
              </div>
              <div>
                <h3>Items</h3>
                <ul>
                  {orderDetails.items.map((item) => (
                    <li key={item.id}>
                      <span>
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatCurrency(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>
                <div className="checkout-page__summary-row">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orderDetails.subtotal)}</span>
                </div>
                <div className="checkout-page__summary-row">
                  <span>Estimated tax</span>
                  <span>{formatCurrency(confirmationTax)}</span>
                </div>
                <div className="checkout-page__summary-row">
                  <span>Shipping</span>
                  <span>Complimentary</span>
                </div>
              </div>
            </div>
            <Link to="/products" className="button button--primary">
              Continue shopping
            </Link>
          </section>
        </div>
      </main>
    );
  }

  if (items.length === 0) {
    return (
      <main className="section checkout-page" role="main">
        <div className="inner checkout-page__shell">
          <h1>Your cart is waiting.</h1>
          <p>
            Select a style you love and return here to complete your order.
          </p>
          <button type="button" className="button button--primary" onClick={() => navigate("/products")}>
            Browse shoes
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="section checkout-page" role="main">
      <div className="inner checkout-page__shell">
        <header className="checkout-page__header">
          <h1>Secure checkout</h1>
          <p>Complete your details to place the order.</p>
        </header>

        <div className="checkout-page__grid">
          <form className="checkout-page__form surface" onSubmit={handleSubmit} noValidate>
            <h2>Contact & shipping</h2>
            <div className="checkout-page__field">
              <label htmlFor="fullName">Full name</label>
              <input
                id="fullName"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                required
              />
              {errors.fullName && <span className="checkout-page__error">{errors.fullName}</span>}
            </div>
            <div className="checkout-page__field">
              <label htmlFor="addressLine">Address</label>
              <input
                id="addressLine"
                name="addressLine"
                value={form.addressLine}
                onChange={handleChange}
                required
              />
              {errors.addressLine && <span className="checkout-page__error">{errors.addressLine}</span>}
            </div>
            <div className="checkout-page__field-grid">
              <div className="checkout-page__field">
                <label htmlFor="city">City</label>
                <input id="city" name="city" value={form.city} onChange={handleChange} required />
                {errors.city && <span className="checkout-page__error">{errors.city}</span>}
              </div>
              <div className="checkout-page__field">
                <label htmlFor="state">State</label>
                <input id="state" name="state" value={form.state} onChange={handleChange} required />
                {errors.state && <span className="checkout-page__error">{errors.state}</span>}
              </div>
            </div>
            <div className="checkout-page__field-grid">
              <div className="checkout-page__field">
                <label htmlFor="phone">Phone</label>
                <input id="phone" name="phone" value={form.phone} onChange={handleChange} required />
                {errors.phone && <span className="checkout-page__error">{errors.phone}</span>}
              </div>
              <div className="checkout-page__field">
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
                {errors.email && <span className="checkout-page__error">{errors.email}</span>}
              </div>
            </div>

            <button type="submit" className="button button--primary">
              Place order
            </button>
          </form>

          <aside className="checkout-page__summary surface">
            <h2>Order summary</h2>
            <ul>
              {items.map((item) => (
                <li key={item.id}>
                  <div>
                    <span>{item.name}</span>
                    <small>Qty {item.quantity}</small>
                  </div>
                  <span>{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="checkout-page__summary-row">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="checkout-page__summary-row">
              <span>Estimated tax</span>
              <span>{formatCurrency(taxEstimate)}</span>
            </div>
            <div className="checkout-page__summary-row">
              <span>Shipping</span>
              <span>Complimentary</span>
            </div>
            <div className="checkout-page__summary-row checkout-page__summary-row--total">
              <span>Total due</span>
              <span>{formatCurrency(orderTotal)}</span>
            </div>
            <p className="checkout-page__note">
              You are placing an order for {totalItems} item{totalItems > 1 ? "s" : ""}. Charges will only apply once the
              order ships.
            </p>
          </aside>
        </div>
      </div>

      {transactionModalOpen && pendingOrder && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="transaction-title">
          <div className="modal__backdrop" />
          <div className="modal__content surface">
            <div className="modal__header">
              <h2 id="transaction-title">Confirm transaction</h2>
              <button type="button" onClick={handleCloseTransactionModal} aria-label="Close transaction dialog">
                ×
              </button>
            </div>
            <p className="modal__description">
              Enter the payment transaction ID provided by your payment gateway to finalize order{" "}
              <strong>{pendingOrder.id}</strong>.
            </p>
            <div className="modal__field">
              <label htmlFor="transactionId">Transaction ID</label>
              <input
                id="transactionId"
                name="transactionId"
                value={transactionInput}
                onChange={handleTransactionInput}
                placeholder="e.g. TXN-98231"
                autoFocus
              />
              {transactionError && <span className="modal__error">{transactionError}</span>}
            </div>
            <div className="modal__actions">
              <button type="button" className="button button--dark" onClick={handleCloseTransactionModal}>
                Cancel
              </button>
              <button type="button" className="button button--primary" onClick={handleConfirmTransaction}>
                Complete order
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default CheckoutPage;
