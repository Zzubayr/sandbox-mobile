import { NextRequest, NextResponse } from 'next/server';

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

        // Forward to Better Auth's email-otp verify endpoint with password parameter
        const response = await fetch(`${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/api/auth/email-otp/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email.trim().toLowerCase(),
                otp,
                password: newPassword
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            return NextResponse.json(
                { error: error || 'Invalid or expired OTP code' },
                { status: response.status }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Password has been reset successfully'
        });
    } catch (error: any) {
        console.error('Reset password error:', error);
        return NextResponse.json(
            { error: error?.message || 'Failed to reset password' },
            { status: 500 }
        );
    }
}
