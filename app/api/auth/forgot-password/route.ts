import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email } = await req.json();

        if (!email) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Call Better Auth's API handler directly
        const forgetPasswordRequest = new Request(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/forget-password/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
        });

        const response = await auth.handler(forgetPasswordRequest);

        if (!response.ok) {
            const error = await response.text();
            console.error('Forget password error:', error);
            return NextResponse.json(
                { error: error || 'Failed to send reset code' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'If an account exists with this email, a reset code has been sent.'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
