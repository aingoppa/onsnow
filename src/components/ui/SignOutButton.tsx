
"use client";

import { useRouter } from "next/navigation";
import { getBrowserClient } from '@/lib/supabase/browser'

export const SignOutButton = () => {
    const supabase = getBrowserClient();
    const router = useRouter();

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/sign-in");
        router.refresh();
    };

    return (
        <button onClick={handleSignOut}>Sign Out</button>
    );
};