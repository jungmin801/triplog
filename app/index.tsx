import { useAuth } from "@/provider/authProvider";
import { Redirect } from "expo-router";

export default function Index() {
  const { session, loading } = useAuth();

  if (loading) return null;

  return session ? <Redirect href="/journeys" /> : <Redirect href="/login" />;
}
