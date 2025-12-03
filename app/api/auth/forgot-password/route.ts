import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Forward to Better Auth's email-otp endpoint with forget-password type
        const response = await fetch(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/email-otp/send-verification-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                type: 'forget-password'
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json(
                { error: error || 'Failed to send reset code' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'A reset code has been sent to your email.'
        });
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to send reset code' },
            { status: 500 }
        );
    }
}
