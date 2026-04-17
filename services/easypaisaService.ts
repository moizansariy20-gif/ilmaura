
// services/easypaisaService.ts

/**
 * This service simulates interaction with the EasyPaisa Payment Gateway.
 * In a real-world scenario, the `generatePaymentLink` and `verifyPayment`
 * functions would typically:
 * 1. Be called from a secure backend server to protect sensitive credentials (hashKey, merchantId).
 * 2. Involve actual API calls to EasyPaisa's endpoints.
 * 3. Handle cryptographic hashing for transaction integrity.
 * 4. Process webhooks from EasyPaisa for real-time payment status updates.
 *
 * For this frontend-only AI Studio exercise, we are creating a simplified,
 * client-side simulation. DO NOT use this directly in production with real
 * EasyPaisa credentials.
 */

interface EasyPaisaConfig {
  enabled: boolean;
  sandboxMode: boolean;
  merchantId: string;
  hashKey: string;
  storeId: string;
  integrationDetails?: string;
}

interface StudentInfo {
  id: string;
  name: string;
  rollNo: string;
  classId: string;
  phone?: string;
}

/**
 * Simulates generating an EasyPaisa payment link.
 *
 * @param config EasyPaisa configuration for the school.
 * @param studentInfo Student details for the payment.
 * @param schoolId The ID of the school.
 * @param amount The amount to be paid.
 * @param description A brief description of the payment.
 * @returns A simulated payment URL and a unique order ID.
 */
export const generateEasyPaisaPaymentLink = (
  config: EasyPaisaConfig,
  studentInfo: StudentInfo,
  schoolId: string,
  amount: number,
  description: string,
): { paymentUrl: string; orderId: string } | null => {
  if (!config.enabled) {
    console.warn("EasyPaisa is not enabled for this school.");
    return null;
  }

  // Generate a unique order ID for EasyPaisa
  const uniqueOrderId = `EP-${schoolId}-${studentInfo.id}-${Date.now()}`;
  
  // Base URL for EasyPaisa payments
  const basePaymentUrl = config.sandboxMode
    ? "https://sandbox.easypaisa.com/payment" // Mock sandbox URL
    : "https://www.easypaisa.com/payment"; // Mock production URL

  // In a real scenario, parameters like amount, orderId, merchantId, description,
  // and a computed hash (using config.hashKey) would be securely sent to EasyPaisa's API.
  // The response would contain the actual payment URL.
  // This is a simplified client-side mock. We are constructing a hypothetical URL.
  const paymentUrl = `${basePaymentUrl}?amount=${amount}&orderId=${uniqueOrderId}&merchantId=${config.merchantId}&description=${encodeURIComponent(description)}&schoolId=${schoolId}&studentId=${studentInfo.id}`;

  console.log(`Generated EasyPaisa Payment Link (${config.sandboxMode ? 'Sandbox' : 'Production'}):`, paymentUrl);

  return { paymentUrl, orderId: uniqueOrderId };
};

/**
 * Simulates verifying an EasyPaisa payment status.
 * In a real application, this would typically involve EasyPaisa webhooks
 * calling your backend, or a backend polling EasyPaisa's API.
 * For this simulation, it will always return 'Success' in sandbox,
 * or 'Pending' in production.
 *
 * @param config EasyPaisa configuration for the school.
 * @param orderId The EasyPaisa order ID to verify.
 * @returns A simulated payment status ('Success', 'Pending', 'Failed').
 */
export const verifyEasyPaisaPayment = async (
  config: EasyPaisaConfig,
  orderId: string,
): Promise<'Success' | 'Pending' | 'Failed'> => {
  if (config.sandboxMode) {
    // In sandbox, we can assume immediate success for simulation purposes
    console.log(`EasyPaisa Sandbox: Payment ${orderId} verified as Success.`);
    return 'Success';
  } else {
    // In production, real verification would occur. For simulation, return pending.
    console.log(`EasyPaisa Production: Simulating verification for ${orderId}. Returning 'Pending'.`);
    // Simulate a slight delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));
    return 'Pending'; // Or 'Failed' based on more complex mock logic
  }
};
