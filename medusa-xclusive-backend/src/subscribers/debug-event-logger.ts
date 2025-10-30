import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';

/**
 * Debug subscriber that logs all events to help troubleshoot order creation issues
 */
export default async function debugEventLogger({
  event: { name, data }
}: SubscriberArgs<any>) {
  console.log('🔍 EVENT TRIGGERED:', {
    eventName: name,
    timestamp: new Date().toISOString(),
    dataKeys: Object.keys(data || {}),
    data: JSON.stringify(data, null, 2)
  });
}

export const config: SubscriberConfig = {
  event: [
    'order.*',
    'payment.*',
    'cart.*',
    'payment_collection.*'
  ]
}; 