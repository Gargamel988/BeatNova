import { supabase } from "./supabase";

export const getUser = async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error || !data.session) {
        return null;
    }

    return data.session.user;
}