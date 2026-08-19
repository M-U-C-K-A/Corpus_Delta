import Link from "next/link";
import { Globe2, Twitter, Github, Linkedin, Mail } from "lucide-react";

export const Footer = () => {
  const navigationItems = [
    {
      title: "Home",
      href: "/",
      description: "",
    },
    {
      title: "Articles",
      href: "/articles",
      description: "Read our latest articles.",
    },
    {
      title: "Write",
      href: "/editor",
      description: "Collaborate by writing an article.",
    },
  ];

  const resources = [
    { title: "Data Sources", href: "#" },
    { title: "Research Guidelines", href: "#" },
    { title: "Peer Review Process", href: "#" },
    { title: "Citation Guide", href: "#" },
  ];

  const legal = [
    { title: "Terms of Service", href: "#" },
    { title: "Privacy Policy", href: "/privacy" },
    { title: "Open Access Policy", href: "#" },
  ];

  return (
    <footer className="w-full py-16 lg:py-24 bg-foreground text-background">
      <div className="container mx-auto">
        <div className="grid lg:grid-cols-4 gap-12 items-start">
          {/* Brand Column */}
          <div className="flex gap-6 flex-col items-start lg:col-span-1">
            <div className="flex items-center gap-2">
              <Globe2 className="w-8 h-8 text-green-400" />
              <h2 className="text-2xl font-bold">
                Global Climate Institute
              </h2>
            </div>
            <p className="text-sm leading-relaxed tracking-tight text-background/70 text-left max-w-xs">
              The world&apos;s largest open-access platform for peer-reviewed climate research. Connecting 10,000+ scientists from 150+ countries to accelerate climate action.
            </p>
            <div className="flex gap-4 mt-2">
              <a href="#" className="text-background/70 hover:text-green-400 transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-green-400 transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-green-400 transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-green-400 transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navigation Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-background/90">Navigate</h3>
            {navigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm text-background/70 hover:text-green-400 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Resources Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-background/90">Resources</h3>
            {resources.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm text-background/70 hover:text-green-400 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Legal Column */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-semibold text-background/90">Legal</h3>
            {legal.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="text-sm text-background/70 hover:text-green-400 transition-colors"
              >
                {item.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/60">
            © 2026 Global Climate Institute. All rights reserved. Open-source and free forever.
          </p>
          <p className="text-sm text-background/60">
            Built with 💚 by researchers, for researchers.
          </p>
        </div>
      </div>
    </footer>
  );
};
