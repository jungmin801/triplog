import { supabase } from "@/lib/supabase";
import { useAuth } from "@/provider/authProvider";
import { useQuery } from "@tanstack/react-query";

export default function useMember() {
  const { session } = useAuth();
  const userId = session?.user?.id ?? "";
  const { data: member, error } = useQuery({
    queryKey: ["member", userId],
    queryFn: async () => {
      const { data, error: e } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (e) throw e;
      return data;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });

  return { member, error };
}
