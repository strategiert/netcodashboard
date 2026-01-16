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

const brandIcons: Record<string, React.ReactNode> = {
  bodycam: <Camera className="h-4 w-4" />,
  bautv: <HardHat className="h-4 w-4" />,
  microvista: <Microscope className="h-4 w-4" />,
};

export function BrandSelector() {
  const brands = useQuery(api.brands.list);
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const currentBrand = params.brand as string;

  const handleBrandChange = (slug: string) => {
    const newPath = pathname.replace(`/${currentBrand}`, `/${slug}`);
    router.push(newPath);
  };

  if (!brands) {
    return (
      <div className="h-10 w-[180px] animate-pulse rounded-md bg-muted" />
    );
  }

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
