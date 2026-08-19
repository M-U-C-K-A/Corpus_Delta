import { MoveRight, Microscope, Pen, Users, Heart } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const CTA = () => (
  <div className="w-full py-20 lg:py-40">
    <div className="container mx-auto">
      <div className="flex flex-col text-center bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-teal-900/20 border border-green-500/20 rounded-2xl p-8 lg:p-20 gap-10 items-center">
        <div>
          <Badge className="bg-green-500/10 text-green-600 border-green-500/30">🤝 Join the Movement</Badge>
        </div>
        <div className="flex flex-col gap-4">
          <h3 className="text-3xl md:text-5xl tracking-tighter max-w-3xl font-bold">
            Become Part of the World&apos;s Largest Climate Research Community
          </h3>
          <p className="text-lg leading-relaxed tracking-tight text-muted-foreground max-w-2xl">
            Whether you&apos;re a <strong>climate scientist</strong> with decades of research, a <strong>student</strong> passionate about environmental justice, or a <strong>citizen</strong> who wants to make a difference — there&apos;s a place for you here. Our platform is built on the principle that <strong>knowledge should be free and accessible to all</strong>. Join over 10,000 researchers from 150+ countries who are already contributing to our mission.
          </p>
        </div>

        {/* Contribution Options */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl mt-4">
          <div className="flex flex-col items-center p-6 bg-background/50 rounded-xl border hover:border-green-500/50 transition-colors">
            <Microscope className="w-10 h-10 text-green-500 mb-4" />
            <h4 className="font-semibold text-lg mb-2">For Researchers</h4>
            <p className="text-sm text-muted-foreground text-center">Publish your peer-reviewed work to a global audience and collaborate with scientists worldwide.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-background/50 rounded-xl border hover:border-blue-500/50 transition-colors">
            <Pen className="w-10 h-10 text-blue-500 mb-4" />
            <h4 className="font-semibold text-lg mb-2">For Writers</h4>
            <p className="text-sm text-muted-foreground text-center">Translate complex science into accessible articles that inform and inspire action.</p>
          </div>
          <div className="flex flex-col items-center p-6 bg-background/50 rounded-xl border hover:border-purple-500/50 transition-colors">
            <Heart className="w-10 h-10 text-purple-500 mb-4" />
            <h4 className="font-semibold text-lg mb-2">For Supporters</h4>
            <p className="text-sm text-muted-foreground text-center">Help fund our infrastructure and keep climate research free and open for everyone.</p>
          </div>
        </div>

        <div className="flex flex-row gap-4 mt-4">
          <Link href="/editor">
            <Button size="lg" className="gap-2">
              Submit Your Research <MoveRight className="w-4 h-4" />
            </Button>
          </Link>
          <Button size="lg" variant="outline" className="gap-2">
            Support Our Mission <Heart className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  </div>
);
