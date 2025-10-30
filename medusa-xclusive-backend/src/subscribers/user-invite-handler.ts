import { type SubscriberConfig, type SubscriberArgs } from "@medusajs/medusa";
import { Modules } from "@medusajs/framework/utils";
import { ResendNotificationTemplates } from '../modules/resend-notification/service';

export default async function userInviteHandler({
  event: { data },
  container,
}: SubscriberArgs<any>) {
  
  // --- Enhanced logging for debugging ---
  console.log('✅ Invite handler triggered for invite event');
  console.log("🔍 FULL EVENT DATA:", JSON.stringify(data, null, 2));
  console.log("📊 Event data keys:", Object.keys(data || {}));
  
  try {
    // Use query service to get invite details
    const query = container.resolve("query");
    
    console.log("🔍 Retrieving invite details for ID:", data.id);
    
    const { data: invites } = await query.graph({
      entity: "invite",
      fields: ["id", "email", "token", "user_email"],
      filters: {
        id: data.id
      }
    });

    console.log("📋 Retrieved invite data:", JSON.stringify(invites[0] || {}, null, 2));
    
    const invite = invites[0] as any;
    if (!invite) {
      throw new Error(`Invite not found for ID: ${data.id}`);
    }

    // Try different field names for email
    const userEmail = invite["email"] || invite["user_email"];
    const token = invite["token"];
    
    console.log("📨 Preparing to send invite email to:", userEmail);
    console.log("🔑 Token data:", { token: token?.substring(0, 10) + '...' });

    if (!userEmail || !token) {
      throw new Error(`Missing required fields: email=${userEmail}, token=${token}`);
    }

    const notificationModuleService = container.resolve(
      Modules.NOTIFICATION
    );
    
    // --- Add logging right before sending ---
    console.log(`🚀 Calling notification service to send INVITE_CREATED template...`);

    await notificationModuleService.createNotifications({
      to: userEmail,
      channel: "email",
      template: ResendNotificationTemplates.INVITE_CREATED,
      data: {
        subject: 'You have been invited!',
        user_email: userEmail,
        token: token,
      },
    });

    console.log("✅ Invite email notification created successfully!");
  } catch (error) {
    console.error("❌ ERROR sending invite email:", error);
    throw error;
  }
}

export const config: SubscriberConfig = {
  // Listen for BOTH events
  event: ["invite.created", "invite.resent"],
}; 