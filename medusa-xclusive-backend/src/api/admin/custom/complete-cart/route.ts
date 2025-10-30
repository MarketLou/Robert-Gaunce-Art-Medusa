import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';
import { completeCartWorkflow } from "@medusajs/medusa/core-flows"

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    const { cart_id } = req.body as { cart_id: string }

    if (!cart_id) {
      return res.status(400).json({
        error: "cart_id is required"
      })
    }

    console.log('🔧 MANUAL CART COMPLETION - Starting for cart:', cart_id)
    
    // Execute the cart completion workflow manually
    const { result } = await completeCartWorkflow(req.scope).run({
      input: {
        id: cart_id
      }
    })

    console.log('✅ MANUAL CART COMPLETION - Success:', {
      cartId: cart_id,
      result: result
    })

    return res.status(200).json({
      success: true,
      cart_id,
      result
    })

  } catch (error) {
    console.error('❌ MANUAL CART COMPLETION - Error:', error)
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    })
  }
} 