"use client";

import { useEffect, useState } from "react";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

const partners = [
  { src: "/WWF.svg", alt: "World Wildlife Fund", name: "WWF" },
  { src: "/350.svg", alt: "350.org", name: "350.org" },
  { src: "/WWF.svg", alt: "World Wildlife Fund", name: "WWF" },
  { src: "/350.svg", alt: "350.org", name: "350.org" },
  { src: "/WWF.svg", alt: "World Wildlife Fund", name: "WWF" },
  { src: "/350.svg", alt: "350.org", name: "350.org" },
];

export const Case = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!api) {
      return;
    }

    setTimeout(() => {
      if (api.selectedScrollSnap() + 1 === api.scrollSnapList().length) {
        setCurrent(0);
        api.scrollTo(0);
      } else {
        api.scrollNext();
        setCurrent(current + 1);
      }
    }, 1500);
  }, [api, current]);

  return (
    <div className="w-full py-20 lg:py-32 bg-muted/30">
      <div className="container mx-auto">
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-4 text-center items-center">
            <h2 className="text-2xl md:text-4xl tracking-tighter max-w-2xl font-bold">
              Trusted by Leading Institutions Worldwide
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Our research is supported by partnerships with the world&apos;s most respected environmental organizations, universities, and government agencies. Together, we are building a comprehensive knowledge base for climate action.
            </p>
          </div>
          <Carousel setApi={setApi} className="w-full max-w-4xl mx-auto">
            <CarouselContent>
              {partners.map((partner, index) => (
                <CarouselItem className="basis-1/3 lg:basis-1/4" key={index}>
                  <div className="flex flex-col rounded-xl aspect-square bg-background items-center justify-center p-6 border hover:border-green-500/50 transition-colors">
                    <img src={partner.src} alt={partner.alt} className="h-16 mb-4 grayscale hover:grayscale-0 transition-all" />
                    <span className="text-sm text-muted-foreground">{partner.name}</span>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
      </div>
    </div>
  );
};
