"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useParams, useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Camera, HardHat, Microscope } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { canSeeBrand } from "@/lib/sections";

const brandIcons: Record<string, React.ReactNode> = {
  bodycam: <Camera className="h-4 w-4" />,
  bautv: <HardHat className="h-4 w-4" />,
  microvista: <Microscope className="h-4 w-4" />,
};

export function BrandSelector() {
  const allBrands = useQuery(api.brands.list);
  const me = useCurrentUser();
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentBrand = params.brand as string;

  const handleBrandChange = (slug: string) => {
    const newPath = pathname.replace(`/${currentBrand}`, `/${slug}`);
    router.push(newPath);
  };

  if (!allBrands) {
    return (
      <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
    );
  }

  // Nur Marken zeigen, die der Nutzer sehen darf (Admin: alle).
  const brands = allBrands.filter((b) => canSeeBrand(me, b.slug));

  // Ein Nutzer mit nur einer erlaubten Marke braucht keinen Umschalter.
  if (brands.length <= 1) return null;

  const selectedBrand = brands.find((b) => b.slug === currentBrand);

  return (
    <Select value={currentBrand} onValueChange={handleBrandChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue>
          <div className="flex items-center gap-2">
            {brandIcons[currentBrand]}
            <span>{selectedBrand?.name || "Marke wählen"}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {brands.map((brand) => (
          <SelectItem key={brand._id} value={brand.slug}>
            <div className="flex items-center gap-2">
              {brandIcons[brand.slug]}
              <span>{brand.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
