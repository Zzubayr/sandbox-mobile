import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            return NextResponse.json(
                { error: 'Email, OTP, and new password are required' },
                { status: 400 }
            );
        }

        // Validate password strength
        if (newPassword.length < 8) {
            return NextResponse.json(
                { error: 'Password must be at least 8 characters long' },
                { status: 400 }
            );
        }

        // Call Better Auth's API handler directly
        const verifyRequest = new Request(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/forget-password/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                otp,
                password: newPassword
            }),
        });

        const response = await auth.handler(verifyRequest);

        if (!response.ok) {
            const error = await response.text();
            console.error('Verify OTP error:', error);
            return NextResponse.json(
                { error: error || 'Failed to reset password' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: 'Failed to process request' },
            { status: 500 }
        );
    }
}
