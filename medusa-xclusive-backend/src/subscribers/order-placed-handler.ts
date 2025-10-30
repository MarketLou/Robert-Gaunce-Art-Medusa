import type { SubscriberArgs, SubscriberConfig } from '@medusajs/medusa';
import { INotificationModuleService, IOrderModuleService, OrderDTO } from '@medusajs/types';
import { MedusaError, Modules } from '@medusajs/framework/utils';
import { ResendNotificationTemplates } from '../modules/resend-notification/service';
import { processBigNumberFields } from '../utils/format-order';

/**
 * Subscribers that listen to the `order.placed` event.
 */
export default async function orderPlacedHandler({
  event: { data },
  container
}: SubscriberArgs<OrderDTO>) {
  console.log('🚀 ORDER PLACED EVENT TRIGGERED!', { 
    orderId: data.id,
    timestamp: new Date().toISOString(),
    eventData: data 
  });
  
  try {
    const orderModuleService: IOrderModuleService = container.resolve(Modules.ORDER);
    const notificationModuleService: INotificationModuleService = container.resolve(
      Modules.NOTIFICATION
    );

    console.log('📋 Retrieving order details for:', data.id);

    const order: OrderDTO = await orderModuleService.retrieveOrder(data.id, {
      relations: ['items', 'shipping_methods', 'shipping_address'],
      select: [
        'id',
        'display_id',
        'email',
        'currency_code',
        'created_at',
        'items',
        'total',
        'shipping_address',
        'shipping_methods'
      ]
    });

    console.log('✅ Order retrieved successfully:', {
      id: order.id,
      display_id: order.display_id,
      email: order.email,
      total: order.total
    });

    const processedOrder = processBigNumberFields(order);

    const toEmail = order.email ?? process.env.TO_EMAIL;
    if (!toEmail) {
      throw new MedusaError(MedusaError.Types.UNEXPECTED_STATE, 'Missing to_email in configuration.');
    }

    console.log('📧 Sending order notification to:', toEmail);

    await notificationModuleService.createNotifications({
      to: toEmail,
      channel: 'email',
      template: ResendNotificationTemplates.ORDER_PLACED,
      data: {
        subject: `Your order #${processedOrder.display_id} has been placed!`,
        ...processedOrder,
      },
    });

    console.log('✅ Order placed handler completed successfully for order:', order.display_id);
  } catch (error) {
    console.error('❌ ERROR in order placed handler:', error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  event: 'order.placed'
};
