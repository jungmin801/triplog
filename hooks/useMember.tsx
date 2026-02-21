import { supabase } from "@/lib/supabase";
import { useAuth } from "@/provider/authProvider";
import { useQuery } from "@tanstack/react-query";

export default function useMember() {
  const { session } = useAuth();
  const { data: member, error } = useQuery({
    queryKey: ["member"],
    queryFn: async () => await supabase.from("profiles").select("*").single(),
    enabled: !!session,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.data,
  });

  return { member, error };
}
