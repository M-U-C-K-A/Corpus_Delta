"use client"
import { MoveRight, Users, Globe2, FileText, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Globe from "@/components/magicui/globe";
import Link from "next/link";

export const Hero = () => (
  <div className="w-full">
    <div className="container mx-auto">
      <div className="grid grid-cols-1 gap-12 items-center lg:grid-cols-2">
        <div className="flex gap-6 flex-col">
          <div>
            <Badge className="mb-4" variant="outline">🌍 The World&apos;s Largest Climate Research Platform</Badge>
          </div>
          <div className="flex gap-6 flex-col">
            <h1 className="text-5xl md:text-7xl max-w-2xl tracking-tighter text-left font-bold bg-gradient-to-r from-green-600 via-emerald-500 to-teal-500 bg-clip-text text-transparent">
              Uniting Scientists to Save Our Planet
            </h1>
            <p className="text-xl leading-relaxed tracking-tight text-muted-foreground max-w-xl text-left">
              We are the <strong>Global Climate Institute</strong> — a worldwide collaborative platform where over <strong>10,000 researchers</strong> from <strong>150+ countries</strong> share peer-reviewed articles, groundbreaking data, and actionable insights on climate change. Together, we are building the most comprehensive open-access climate knowledge base ever assembled.
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
              <Users className="w-6 h-6 text-green-500 mb-2" />
              <span className="text-2xl font-bold">10,000+</span>
              <span className="text-sm text-muted-foreground">Researchers</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
              <Globe2 className="w-6 h-6 text-blue-500 mb-2" />
              <span className="text-2xl font-bold">150+</span>
              <span className="text-sm text-muted-foreground">Countries</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
              <FileText className="w-6 h-6 text-orange-500 mb-2" />
              <span className="text-2xl font-bold">50,000+</span>
              <span className="text-sm text-muted-foreground">Articles</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-muted/50 rounded-lg border">
              <BookOpen className="w-6 h-6 text-purple-500 mb-2" />
              <span className="text-2xl font-bold">Open</span>
              <span className="text-sm text-muted-foreground">Access</span>
            </div>
          </div>

          {/* CTAs */}
          <div className="flex flex-row gap-4 mt-4">
            <Link href="/articles">
              <Button size="lg" className="gap-2">
                Explore Research <MoveRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/editor">
              <Button size="lg" variant="outline" className="gap-2">
                Contribute an Article
              </Button>
            </Link>
          </div>
        </div>
        <div className="bg-muted rounded-xl aspect-square shadow-2xl">
          <Globe />
        </div>
      </div>
    </div>
  </div>
);
