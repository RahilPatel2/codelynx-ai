/**
 * Payment Provider Abstraction Layer
 *
 * Designed for future integration with Indian payment gateways (e.g. Razorpay, Cashfree, UPI).
 * Currently executes simulated subscriptions for development and local testing.
 *
 * CRITICAL SECURITY INVARIANT:
 * Paid entitlements must only be granted through verified server-side order confirmation
 * or cryptographic webhook verification, NEVER purely on unverified client callbacks.
 */

import { PlanId, getPlan } from "./plans";

export interface CreateOrderParams {
  userId: string;
  planId: PlanId;
  userEmail: string;
}

export interface OrderResult {
  orderId: string;
  amountInr: number;
  currency: "INR";
  planId: PlanId;
  provider: "simulated" | "razorpay";
  status: "created" | "completed";
  requiresClientCheckout: boolean;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderId?: string;
  paymentId?: string;
  userId?: string;
  planId?: PlanId;
  error?: string;
}

export interface IPaymentGateway {
  name: string;
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyWebhook(payload: any, signature: string): Promise<WebhookVerificationResult>;
}

/**
 * Simulated Payment Gateway for Development & Testing
 */
export class SimulatedPaymentGateway implements IPaymentGateway {
  public name = "simulated";

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const plan = getPlan(params.planId);
    const orderId = `sim_ord_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return {
      orderId,
      amountInr: plan.priceInr,
      currency: "INR",
      planId: plan.id,
      provider: "simulated",
      status: "completed",
      requiresClientCheckout: false,
    };
  }

  async verifyWebhook(_payload: any, _signature: string): Promise<WebhookVerificationResult> {
    return {
      isValid: true,
      error: "Simulated gateway does not consume real webhooks",
    };
  }
}

/**
 * Future Razorpay Integration Stub
 * (Ready to be wired when API keys RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET are supplied)
 */
export class RazorpayPaymentGatewayStub implements IPaymentGateway {
  public name = "razorpay";

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const plan = getPlan(params.planId);
    throw new Error(
      `Razorpay payment gateway is not yet active in this development environment. Plan: ${plan.name}`
    );
  }

  async verifyWebhook(_payload: any, _signature: string): Promise<WebhookVerificationResult> {
    return {
      isValid: false,
      error: "Razorpay webhook secret not configured",
    };
  }
}

// Active provider instance (simulated for current development stage)
export const paymentGateway: IPaymentGateway = new SimulatedPaymentGateway();
