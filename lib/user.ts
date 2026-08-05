import { supabase } from "./supabase";

export const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        return null;
    }

    const user = data?.user;
    return user;
}