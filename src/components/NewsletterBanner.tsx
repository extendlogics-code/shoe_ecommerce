const NewsletterBanner = () => {
  return (
    <section className="section newsletter" id="updates">
      <div className="inner newsletter__shell surface">
        <div className="newsletter__content">
          <span className="eyebrow">Stay in the loop</span>
          <h2>Get early access to drops and private fittings</h2>
          <p>
            Join Kalaa Collective for pre-launch access, styling appointments, and exclusive
            rewards tailored to your profile.
          </p>
        </div>
        <form className="newsletter__form">
          <div className="newsletter__field">
            <label htmlFor="newsletter-email">Email</label>
            <input
              id="newsletter-email"
              type="email"
              name="email"
              placeholder="name@email.com"
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" className="button button--primary">
            Join the Collective
          </button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterBanner;
