import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export const Article = () => (
    <div className="w-full py-10">
        <div className="container mx-auto">
            <div className="flex flex-col gap-10">
                <div className="flex gap-4 flex-col items-start">
                    <div>
                        <Badge variant="secondary">📚 Featured Research</Badge>
                    </div>
                    <div className="flex gap-4 flex-col">
                        <h2 className="text-3xl md:text-5xl tracking-tighter max-w-2xl font-bold text-left">
                            Peer-Reviewed Climate Research from Around the Globe
                        </h2>
                        <p className="text-lg max-w-3xl leading-relaxed tracking-tight text-muted-foreground text-left">
                            Every article on our platform undergoes rigorous peer review by our international network of climate scientists. From melting ice caps in the Arctic to droughts in Sub-Saharan Africa, our researchers document the real-world impacts of climate change and propose evidence-based solutions. Explore our most impactful studies below, or browse our full library of <strong>50,000+ open-access articles</strong>.
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    <Link href="/articles/en/melting-of-ice-caps" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">
                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">
                            <img src="/articles/ice-melting.png" alt="melting of ice caps" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">Melting of Ice Caps</h3>
                        <p className="text-muted-foreground text-base">
                            Current statistics and trends,
                            consequences on the environment and populations,
                            contributing factors, and strategies for mitigation.
                        </p>
                    </Link>
                    <Link href="/articles/en/loss-of-biodiversity" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">
                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">

                            <img src="/articles/biodiversity-loss.png" alt="Loss of Biodiversity" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">Loss of Biodiversity</h3>
                        <p className="text-muted-foreground text-base">
                            Data on biodiversity decline,
                            ecological and economic repercussions, causes,
                            and solutions for conservation and restoration.
                        </p>
                    </Link>

                    <Link href="/articles/en/world-hunger" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">

                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">

                            <img src="/articles/world-hunger.png" alt="World Hunger" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">World Hunger</h3>
                        <p className="text-muted-foreground text-base">
                            Statistics on global hunger, effects of climate change,
                            underlying causes, and initiatives to enhance food security.
                        </p>
                    </Link>

                    <Link href="/articles/en/climate-types" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">
                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">
                            <img src="/articles/climate-types.png" alt="Climate Types" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">Climate Types</h3>
                        <p className="text-muted-foreground text-base">
                            Characteristics of climate types, impact of climate change,
                            and necessary adaptations.
                        </p>
                    </Link>

                    <Link href="/articles/en/co2-emissions" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">
                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">
                            <img src="/articles/co2-emissions.png" alt="CO₂ Emissions" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">CO₂ Emissions</h3>
                        <p className="text-muted-foreground text-base">
                            Global emission trends, impact of emerging economies, key sectors, and strategies for reduction.
                        </p>
                    </Link>

                    <Link href="/articles/en/drought-in-africa" className="flex flex-col gap-2 group hover:shadow-lg transition-all p-4 rounded-md border border-transparent hover:border-border">
                        <div className="bg-muted rounded-md aspect-video mb-2 overflow-hidden">
                            <img src="/articles/drought-africa.png" alt="Drought in Africa" className="w-full aspect-video object-cover transition-transform duration-300 group-hover:scale-105" />
                        </div>
                        <h3 className="text-xl tracking-tight font-semibold">Drought in Africa</h3>
                        <p className="text-muted-foreground text-base">
                            Prevalence, consequences, climate factors,
                            and measures to enhance resilience in African communities.
                        </p>
                    </Link>
                </div>
            </div>
        </div>
    </div >
);
