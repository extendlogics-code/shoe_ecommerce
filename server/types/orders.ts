export interface AddressInput {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  postalCode: string;
  country: string;
  label?: string;
}

export interface CustomerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface OrderItemInput {
  productId: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  tax?: number;
}

export interface OrderCreateInput {
  orderNumber?: string;
  transactionId: string;
  channel?: string;
  currency?: string;
  customer: CustomerInput;
  billingAddress?: AddressInput;
  shippingAddress: AddressInput;
  items: OrderItemInput[];
  totalAmount: number;
  status?: string;
  note?: string;
}
