import { createBrowserClient } from "@supabase/ssr";

export function createClient(accessToken?: string | null) {
    const options = accessToken
        ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
        : {};

    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        options
    );
}
