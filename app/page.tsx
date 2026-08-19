"use client"
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Case } from "@/components/Cases";
import { Article } from "@/components/Article";
import { CTA } from "@/components/CTA";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";
export default function Home() {
  return (
    <>
      <Header />
      <main className="flex min-h-screen flex-col items-center justify-between gap-20 py-20 lg:py-40">
        <Hero />
        <Article />
        <Case />
        <CTA />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}
