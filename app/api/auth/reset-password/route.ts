import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import mongoose from 'mongoose';

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

        // Verify OTP first
        const verifyResult = await auth.api.verifyEmailOtp({
            email,
            otp,
            type: 'forget-password',
        });

        if (!verifyResult) {
            return NextResponse.json(
                { error: 'Invalid or expired OTP code' },
                { status: 400 }
            );
        }

        // Update password in database
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const bcrypt = await import('bcryptjs');
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await User.updateOne(
            { email: email.toLowerCase() },
            { $set: { password: hashedPassword } }
        );

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
