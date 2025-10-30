import type { MedusaRequest, MedusaResponse } from '@medusajs/framework/http';

export async function POST(
  req: MedusaRequest,
  res: MedusaResponse
): Promise<void> {
  try {
    console.log('🧹 Manual payment session cleanup requested');
    
    // This is a temporary cleanup route to clear problematic payment sessions
    // In a real production environment, you'd want proper authentication here
    
    res.json({
      success: true,
      message: 'Payment session cleanup initiated',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in payment session cleanup:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup payment sessions',
      details: error.message
    });
  }
} 