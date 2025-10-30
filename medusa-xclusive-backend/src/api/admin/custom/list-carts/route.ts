import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  try {
    console.log('📋 LISTING CARTS - Request received');
    
    const query = req.scope.resolve("query");
    
    // Query carts with basic info
    const { data: carts } = await query.graph({
      entity: "cart",
      fields: [
        "id",
        "email",
        "completed_at",
        "created_at"
      ],
      filters: {
        created_at: {
          $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    console.log('📋 CARTS FOUND:', carts.length);

    return res.status(200).json({
      success: true,
      carts: carts.map((cart: any) => ({
        id: cart.id,
        email: cart.email,
        completed_at: cart.completed_at,
        created_at: cart.created_at,
        is_completed: !!cart.completed_at
      }))
    });

  } catch (error) {
    console.error('❌ LIST CARTS - Error:', error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
    });
  }
} 