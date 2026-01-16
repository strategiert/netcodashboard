"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Info } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Einstellungen</h1>
          <p className="text-muted-foreground">
            Konfiguration der Marketing Workstation
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5" />
              Über diese App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Version</p>
                <p className="text-muted-foreground">1.0.0 (MVP)</p>
              </div>
              <div>
                <p className="text-sm font-medium">Tech Stack</p>
                <p className="text-muted-foreground">
                  Next.js 14, Tailwind CSS, Convex
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Beschreibung</p>
              <p className="text-muted-foreground">
                Die NetCo Marketing Workstation ist eine einheitliche Plattform
                zur Verwaltung von Marketing-Content für alle drei Marken:
                NetCo Body-Cam, BauTV+ und Microvista.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Schnellzugriff
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Link href="/bodycam">
                <Button variant="outline" className="w-full justify-start">
                  NetCo Body-Cam
                </Button>
              </Link>
              <Link href="/bautv">
                <Button variant="outline" className="w-full justify-start">
                  BauTV+
                </Button>
              </Link>
              <Link href="/microvista">
                <Button variant="outline" className="w-full justify-start">
                  Microvista
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground text-center">
              NetCo Marketing Workstation &copy; 2026
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
