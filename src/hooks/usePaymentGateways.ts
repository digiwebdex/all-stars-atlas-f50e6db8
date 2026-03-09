import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/constants';

interface GatewayStatus {
  ssl: { enabled: boolean; environment: string | null };
  bkash: { enabled: boolean; environment: string | null };
  nagad: { enabled: boolean; environment: string | null };
}

export const usePaymentGatewayStatus = () =>
  useQuery<GatewayStatus>({
    queryKey: ['payment', 'gateways', 'status'],
    queryFn: async () => {
      // Fetch all gateway statuses in parallel
      const [ssl, bkash, nagad] = await Promise.allSettled([
        api.get<{ enabled: boolean; environment: string | null }>(API_ENDPOINTS.PAYMENT_SSL_STATUS),
        api.get<{ enabled: boolean; environment: string | null }>(API_ENDPOINTS.PAYMENT_BKASH_STATUS),
        api.get<{ enabled: boolean; environment: string | null }>(API_ENDPOINTS.PAYMENT_NAGAD_STATUS),
      ]);
      return {
        ssl: ssl.status === 'fulfilled' ? ssl.value : { enabled: false, environment: null },
        bkash: bkash.status === 'fulfilled' ? bkash.value : { enabled: false, environment: null },
        nagad: nagad.status === 'fulfilled' ? nagad.value : { enabled: false, environment: null },
      };
    },
    staleTime: 10 * 60 * 1000, // 10 min cache
    retry: false,
  });

export const useInitSSLPayment = () => {
  return async (data: { bookingId: string; amount: number; customerName: string; customerEmail: string; customerPhone?: string }) => {
    const result = await api.post<{ gatewayUrl: string; tranId: string }>(API_ENDPOINTS.PAYMENT_SSL_INIT, data);
    return result;
  };
};

export const useInitBkashPayment = () => {
  return async (data: { bookingId: string; amount: number }) => {
    const result = await api.post<{ bkashURL: string; paymentID: string }>(API_ENDPOINTS.PAYMENT_BKASH_CREATE, data);
    return result;
  };
};

export const useInitNagadPayment = () => {
  return async (data: { bookingId: string; amount: number }) => {
    const result = await api.post<{ redirectUrl: string; orderId: string }>(API_ENDPOINTS.PAYMENT_NAGAD_INIT, data);
    return result;
  };
};
