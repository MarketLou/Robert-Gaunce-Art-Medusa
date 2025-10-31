import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Diagnostic route to check available payment providers
 * GET /store/custom/payment-providers-debug
 */
export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('🔍 [PAYMENT DEBUG] Checking available payment providers...')
    
    const paymentModuleService = req.scope.resolve("paymentModuleService")
    const paymentProviderService = req.scope.resolve("paymentProviderService")
    
    console.log('🔍 [PAYMENT DEBUG] Payment module service:', !!paymentModuleService)
    console.log('🔍 [PAYMENT DEBUG] Payment provider service:', !!paymentProviderService)
    
    // Try to list all payment providers
    let providers: any[] = []
    let providerIds: string[] = []
    
    try {
      // Attempt to resolve the payment providers container registration
      const container = req.scope
      
      // Try different provider ID formats
      const possibleIds = ['pp_stripe', 'stripe', 'STRIPE', 'pp_stripe_payment']
      
      console.log('🔍 [PAYMENT DEBUG] Testing provider ID resolution:')
      for (const id of possibleIds) {
        try {
          const provider = await container.resolve(id, { allowUnregistered: false })
          console.log(`✅ [PAYMENT DEBUG] Provider ID "${id}" RESOLVES successfully`)
          providerIds.push(id)
          providers.push({ id, status: 'resolved' })
        } catch (error: any) {
          console.log(`❌ [PAYMENT DEBUG] Provider ID "${id}" FAILS: ${error.message}`)
          providers.push({ id, status: 'not_resolved', error: error.message })
        }
      }
      
      // Try to get payment providers via module service
      try {
        const allProviders = await paymentModuleService?.listPaymentProviders?.() || []
        console.log('✅ [PAYMENT DEBUG] Payment providers via module service:', allProviders.length)
        console.log('📋 [PAYMENT DEBUG] Provider IDs from module:', allProviders.map((p: any) => p.id || p.provider_id))
      } catch (error: any) {
        console.log('❌ [PAYMENT DEBUG] Cannot list via module service:', error.message)
      }
      
    } catch (error: any) {
      console.error('❌ [PAYMENT DEBUG] Error checking providers:', error)
      console.error('❌ [PAYMENT DEBUG] Error stack:', error.stack)
    }
    
    return res.json({
      success: true,
      providers,
      providerIds,
      timestamp: new Date().toISOString(),
      message: 'Payment provider diagnostic completed. Check server logs for details.'
    })
    
  } catch (error: any) {
    console.error('❌ [PAYMENT DEBUG] Fatal error:', error)
    console.error('❌ [PAYMENT DEBUG] Error stack:', error.stack)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    })
  }
}

