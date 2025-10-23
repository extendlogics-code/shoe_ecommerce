const normalizeCurrency = (input?: string) => {
  if (!input) {
    return "INR";
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return "INR";
  }
  if (trimmed === "₹") {
    return "INR";
  }
  const isoCurrency = trimmed.toUpperCase();
  return /^[A-Z]{3}$/.test(isoCurrency) ? isoCurrency : "INR";
};

export const formatCurrency = (value: number, currency = "INR") =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: normalizeCurrency(currency),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
