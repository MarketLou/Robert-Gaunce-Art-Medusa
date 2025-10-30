import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';

/**
 * Subscriber to handle customer lookup and prevent duplicate key errors
 */
export default async function customerLookupHandler({
  event: { name, data }
}: SubscriberArgs<any>) {
  console.log('🔍 CUSTOMER EVENT TRIGGERED:', {
    eventName: name,
    customerEmail: data?.email,
    timestamp: new Date().toISOString()
  });
}

export const config: SubscriberConfig = {
  event: [
    'customer.*'
  ]
}; 