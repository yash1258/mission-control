import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

// Password is stored in environment variable, with a default for development
const AUTH_PASSWORD = process.env.MISSION_CONTROL_PASSWORD || 'mission-control-2024';
const AUTH_COOKIE_NAME = 'mission-control-auth';
const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export function getAuthPassword(): string {
    return AUTH_PASSWORD;
}

export function validatePassword(password: string): boolean {
    return password === AUTH_PASSWORD;
}

export function setAuthCookie(response: NextResponse): void {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: 'authenticated',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: AUTH_COOKIE_MAX_AGE,
        path: '/',
    });
}

export function clearAuthCookie(response: NextResponse): void {
    response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: '',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 0,
        path: '/',
    });
}

export async function isAuthenticated(): Promise<boolean> {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    return authCookie?.value === 'authenticated';
}

export async function requireAuth() {
    if (!(await isAuthenticated())) {
        return false;
    }
    return true;
}

// Middleware helper for API routes
export function withAuth(handler: Function) {
    return async (request: NextRequest, context: any) => {
        if (!(await isAuthenticated())) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }
        return handler(request, context);
    };
}
