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

        // Call Better Auth's server-side API to send OTP for password reset
        const result = await auth.api.sendVerificationOTP({
            email,
            type: 'forget-password',
        });

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
