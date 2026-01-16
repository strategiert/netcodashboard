"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function Home() {
  const router = useRouter();
  const brands = useQuery(api.brands.list);
  const seedAll = useMutation(api.seed.seedAll);

  useEffect(() => {
    const initAndRedirect = async () => {
      if (brands === undefined) return;

      // If no brands exist, seed the database
      if (brands.length === 0) {
        await seedAll();
        // Wait a bit for the data to propagate
        setTimeout(() => {
          router.push("/bodycam");
        }, 500);
        return;
      }

      // Redirect to the first brand
      router.push(`/${brands[0].slug}`);
    };

    initAndRedirect();
  }, [brands, router, seedAll]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">NetCo Marketing Workstation</h1>
        <p className="text-muted-foreground">Wird geladen...</p>
        <div className="mt-4 h-1 w-48 mx-auto bg-muted rounded-full overflow-hidden">
          <div className="h-full w-1/2 bg-primary animate-pulse rounded-full" />
        </div>
      </div>
    </div>
  );
}
