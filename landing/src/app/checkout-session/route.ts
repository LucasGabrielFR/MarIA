import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    let planId: string | null = null;
    let cycle: string | null = null;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      planId = body.planId;
      cycle = body.cycle;
    } else {
      const formData = await req.formData();
      planId = formData.get('planId') as string;
      cycle = formData.get('cycle') as string;
    }

    if (!planId || !cycle) {
      return NextResponse.json(
        { error: 'planId and cycle are required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/payment/asaas/checkout-web`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: planId,
        cycle: cycle,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || 'Erro ao criar link de pagamento Asaas' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      url: data.url,
      sessionId: data.sessionId,
    });
  } catch (error: any) {
    console.error('Checkout Session API Route error:', error);
    return NextResponse.json(
      { error: 'Internal server error during checkout session generation' },
      { status: 500 }
    );
  }
}
