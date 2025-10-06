// VIP System Types
export interface VipPurchaseRequest {
  id: string;
  userId: string;
  username: string;
  tier: 'bronze' | 'diamond';
  paymentMethod: 'stars' | 'upi';
  amount: number; // Stars or INR
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: number;
  processedAt?: number;
  adminNotes?: string;
  paymentDetails: {
    utrNumber?: string;
    transactionId?: string;
    invoiceId?: string;
  };
}

export interface VipActivation {
  userId: string;
  tier: 'bronze' | 'diamond';
  activatedBy: 'admin' | 'payment';
  activatedAt: number;
  expiresAt: number;
  duration: number; // days
}