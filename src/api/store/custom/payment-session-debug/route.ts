import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";

/**
 * Diagnostic route to test payment session creation with detailed logging
 * POST /store/custom/payment-session-debug
 * Body: { payment_collection_id: string }
 */
export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { payment_collection_id } = req.body as { payment_collection_id?: string }
    
    console.log('🔍 [PAYMENT SESSION DEBUG] Payment session creation diagnostic started')
    console.log('📋 [PAYMENT SESSION DEBUG] Payment collection ID:', payment_collection_id)
    
    if (!payment_collection_id) {
      return res.status(400).json({
        success: false,
        error: 'payment_collection_id is required'
      })
    }
    
    // Get payment collection
    const paymentModuleService = req.scope.resolve("paymentModuleService")
    
    console.log('🔍 [PAYMENT SESSION DEBUG] Resolving payment collection...')
    let paymentCollection: any = null
    
    try {
      paymentCollection = await paymentModuleService.retrievePaymentCollection(payment_collection_id)
      console.log('✅ [PAYMENT SESSION DEBUG] Payment collection retrieved')
      console.log('📋 [PAYMENT SESSION DEBUG] Collection data:', JSON.stringify({
        id: paymentCollection.id,
        amount: paymentCollection.amount,
        currency_code: paymentCollection.currency_code,
        region_id: paymentCollection.region_id,
        provider_id: paymentCollection.provider_id,
        status: paymentCollection.status
      }, null, 2))
    } catch (error: any) {
      console.error('❌ [PAYMENT SESSION DEBUG] Cannot retrieve collection:', error.message)
      return res.status(500).json({
        success: false,
        error: 'Cannot retrieve payment collection',
        details: error.message
      })
    }
    
    // Check what provider ID the collection expects
    const expectedProviderId = paymentCollection.provider_id
    console.log('🔍 [PAYMENT SESSION DEBUG] Collection expects provider ID:', expectedProviderId)
    
    // Try to resolve the provider
    const container = req.scope
    console.log('🔍 [PAYMENT SESSION DEBUG] Attempting to resolve provider:', expectedProviderId)
    
    try {
      const provider = await container.resolve(expectedProviderId, { allowUnregistered: false })
      console.log('✅ [PAYMENT SESSION DEBUG] Provider resolved successfully!')
      console.log('📋 [PAYMENT SESSION DEBUG] Provider type:', typeof provider)
      console.log('📋 [PAYMENT SESSION DEBUG] Provider constructor:', provider?.constructor?.name)
      
      // Try to create payment session
      console.log('🔍 [PAYMENT SESSION DEBUG] Attempting to create payment session...')
      const session = await paymentModuleService.createPaymentSession(payment_collection_id, {
        provider_id: expectedProviderId
      })
      
      console.log('✅ [PAYMENT SESSION DEBUG] Payment session created successfully!')
      return res.json({
        success: true,
        session,
        message: 'Payment session created successfully'
      })
      
    } catch (resolveError: any) {
      console.error('❌ [PAYMENT SESSION DEBUG] Provider resolution failed:', resolveError.message)
      console.error('❌ [PAYMENT SESSION DEBUG] Error type:', resolveError.constructor?.name)
      console.error('❌ [PAYMENT SESSION DEBUG] Error stack:', resolveError.stack)
      
      // Try alternative provider IDs
      const alternatives = ['stripe', 'STRIPE', 'pp_stripe_payment']
      console.log('🔍 [PAYMENT SESSION DEBUG] Trying alternative provider IDs:', alternatives)
      
      for (const altId of alternatives) {
        try {
          const altProvider = await container.resolve(altId, { allowUnregistered: false })
          console.log(`✅ [PAYMENT SESSION DEBUG] Alternative ID "${altId}" works!`)
          return res.json({
            success: false,
            error: `Provider ID mismatch. Collection expects "${expectedProviderId}" but "${altId}" is available.`,
            expected: expectedProviderId,
            available: altId,
            recommendation: 'Update region provider ID to match available provider'
          })
        } catch {
          // Continue to next alternative
        }
      }
      
      return res.status(500).json({
        success: false,
        error: 'Cannot resolve payment provider',
        expectedProviderId,
        details: resolveError.message,
        stack: resolveError.stack
      })
    }
    
  } catch (error: any) {
    console.error('❌ [PAYMENT SESSION DEBUG] Fatal error:', error)
    console.error('❌ [PAYMENT SESSION DEBUG] Error stack:', error.stack)
    
    return res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    })
  }
}

