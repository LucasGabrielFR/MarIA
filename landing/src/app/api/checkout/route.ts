import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const planId = formData.get('planId'); // 'basic' | 'premium'
    const cycle = formData.get('cycle');   // 'monthly' | 'annual'
    const phone = formData.get('phone') || '11999999999'; 
    
    // In a real flow, we'd collect the phone number on a form before this,
    // or let Asaas Checkout collect it. For Asaas, we'll generate a payment link.

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    
    const response = await fetch(`${apiUrl}/payment/asaas/checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        planId: planId,
        cycle: cycle,
        phone: phone, 
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao criar link de pagamento Asaas');
    }

    return NextResponse.redirect(data.url, 303);
  } catch (error: any) {
    console.error('Checkout error:', error);
    return NextResponse.redirect(new URL('/?error=checkout_failed', req.url), 303);
  }
}
