import { NextResponse } from 'next/server';

/**
 * API route to provide the OpenClaw Gateway token to the client
 * 
 * The token is stored server-side in OPENCLAW_GATEWAY_TOKEN env var
 * and exposed to authenticated clients via this endpoint.
 */
export async function GET() {
    // Get token from environment variable
    const token = process.env.OPENCLAW_GATEWAY_TOKEN;

    if (!token) {
        return NextResponse.json(
            { error: 'Gateway token not configured', token: null },
            { status: 500 }
        );
    }

    // Return token (client needs it for WebSocket auth)
    // Note: This is safe because the token is for the local gateway,
    // and the dashboard is already password-protected
    return NextResponse.json({ token });
}