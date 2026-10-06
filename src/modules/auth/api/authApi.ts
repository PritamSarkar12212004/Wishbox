import { ApiError, apiRequest, type ApiRequestOptions } from '@/lib/api/client';
import { authStore, type Identity, type Session } from '../store/authStore';

/**
 * The auth endpoints, one function per route.
 *
 * Two ways in: the public ones (`requestOtp`, `verifyOtp`) and the account ones
 * (`me`, `updateProfile`, `logout`), which go through `authedRequest` and so get
 * the stored access token, one silent refresh on a 401, and a replay.
 */

/** The shopper record the API returns. */
export type ApiUser = {
    id: string;
    name: string;
    phone: string;
    phoneVerifiedAt: string | null;
    role: 'customer' | 'admin';
    createdAt: string;
    lastLoginAt: string | null;
};

export type RequestOtpResult = {
    phone: string;
    channel: 'whatsapp';
    expiresInSeconds: number;
    resendAfterSeconds: number;
    isNewUser: boolean;
    /**
     * Development only: the API echoes the code when OTP_DEBUG_RETURN_CODE is
     * on. Production responses never carry this field.
     */
    devCode?: string;
};

export type SessionResult = {
    user: ApiUser;
    accessToken: string;
    refreshToken: string;
    expiresInSeconds: number;
};

/** Maps the API's shopper record onto the identity the UI stores. */
export const toIdentity = (user: ApiUser): Identity => ({
    name: user.name,
    phone: user.phone,
    verifiedAt: user.phoneVerifiedAt ? Date.parse(user.phoneVerifiedAt) : Date.now(),
});

/** Maps a session response onto what the store keeps. */
export const toSession = (result: SessionResult): Session => ({
    identity: toIdentity(result.user),
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
});

/**
 * One refresh at a time.
 *
 * Refresh tokens rotate and a replayed one is rejected outright, so two
 * parallel 401s must not both try: the loser would revoke the session for both.
 * The in-flight promise is shared instead.
 */
let refreshing: Promise<string> | null = null;

function refreshAccessToken(): Promise<string> {
    const current = authStore.getSession();
    if (!current) {
        return Promise.reject(
            new ApiError({
                status: 401,
                code: 'UNAUTHENTICATED',
                message: 'Please sign in to continue.',
            })
        );
    }

    refreshing ??= (async () => {
        try {
            const result = await authApi.refresh(current.refreshToken);
            authStore.setSession(toSession(result));
            return result.accessToken;
        } catch (error) {
            // Spent or revoked: drop the session so no screen keeps offering
            // account features that would all fail the same way.
            authStore.signOut();
            throw error;
        } finally {
            refreshing = null;
        }
    })();

    return refreshing;
}

/**
 * A request that needs the signed-in shopper.
 *
 * An expired access token is normal (they last 15 minutes), so a 401 triggers
 * exactly one refresh and one replay before the failure is passed on. A 403
 * (blocked account) is never retried - refreshing cannot fix it.
 */
export async function authedRequest<T>(
    path: string,
    options: ApiRequestOptions = {}
): Promise<T> {
    const current = authStore.getSession();
    if (!current) {
        throw new ApiError({
            status: 401,
            code: 'UNAUTHENTICATED',
            message: 'Please sign in to continue.',
        });
    }

    try {
        return await apiRequest<T>(path, { ...options, token: current.accessToken });
    } catch (error) {
        if (!(error instanceof ApiError) || !error.isUnauthorized) throw error;
        const accessToken = await refreshAccessToken();
        return apiRequest<T>(path, { ...options, token: accessToken });
    }
}

export const authApi = {
    /** Step 1: sends the code on WhatsApp. */
    requestOtp(input: { phone: string; name?: string }): Promise<RequestOtpResult> {
        return apiRequest<RequestOtpResult>('/auth/otp/request', {
            method: 'POST',
            body: input,
        });
    },

    /** Step 2: verifies the code and returns the session to store. */
    verifyOtp(input: { phone: string; code: string; name?: string }): Promise<SessionResult> {
        return apiRequest<SessionResult>('/auth/otp/verify', {
            method: 'POST',
            body: input,
        });
    },

    refresh(refreshToken: string): Promise<SessionResult> {
        return apiRequest<SessionResult>('/auth/refresh', {
            method: 'POST',
            body: { refreshToken },
        });
    },

    me(): Promise<ApiUser> {
        return authedRequest<ApiUser>('/auth/me');
    },

    updateProfile(input: { name: string }): Promise<ApiUser> {
        return authedRequest<ApiUser>('/users/me', { method: 'PATCH', body: input });
    },

    /**
     * Revokes the session server-side.
     *
     * The tokens are passed in rather than read here, because the caller signs
     * out locally *first* (so the UI reacts at once) and by then there is
     * nothing left in the store to authorise with. It also skips the refresh
     * path on purpose: a request whose whole point is to end the session must
     * not try to extend it.
     */
    logout(input: {
        accessToken: string;
        refreshToken?: string;
        allDevices?: boolean;
    }): Promise<void> {
        return apiRequest<void>('/auth/logout', {
            method: 'POST',
            token: input.accessToken,
            body: { refreshToken: input.refreshToken, allDevices: input.allDevices ?? false },
        });
    },
};
