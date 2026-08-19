import { Check, PhoneCall } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

export const FAQ = () => (
  <div className="w-full py-20">
    <div className="container mx-auto">
      <div className="grid lg:grid-cols-2 gap-10">
        <div className="flex gap-10 flex-col">
          <div className="flex gap-4 flex-col">
            <div>
              <Badge variant="outline">❓ Frequently Asked Questions</Badge>
            </div>
            <div className="flex gap-4 flex-col">
              <h4 className="text-3xl md:text-5xl tracking-tighter max-w-xl text-left font-bold">
                Everything You Need to Know
              </h4>
              <p className="text-lg max-w-xl lg:max-w-lg leading-relaxed tracking-tight text-muted-foreground text-left">
                Learn more about how the Global Climate Institute operates, where our data comes from, and how you can become part of the world&apos;s largest climate research community.
              </p>
            </div>
            <div className="flex gap-4">
              <Button className="gap-2" variant="outline">
                Contact our team <PhoneCall className="w-4 h-4" />
              </Button>
              <Button className="gap-2" variant="ghost">
                <Check className="w-4 h-4" /> View all FAQs
              </Button>
            </div>
          </div>
        </div>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1">
            <AccordionTrigger>Where does your climate data come from?</AccordionTrigger>
            <AccordionContent>
              Our data is sourced from the world&apos;s leading scientific institutions: <strong>NASA</strong>, <strong>NOAA</strong>, the <strong>Intergovernmental Panel on Climate Change (IPCC)</strong>, the <strong>World Meteorological Organization</strong>, and hundreds of university research labs. We also integrate original datasets submitted by our global network of over 10,000 researchers.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-2">
            <AccordionTrigger>How does the peer-review process work?</AccordionTrigger>
            <AccordionContent>
              Every article submitted to our platform undergoes a rigorous double-blind peer review by at least two independent experts in the relevant field. This process typically takes 2-4 weeks. Once approved, articles are published with a &quot;Certified&quot; badge indicating they have passed our scientific standards.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-3">
            <AccordionTrigger>Can anyone contribute research?</AccordionTrigger>
            <AccordionContent>
              Yes! We welcome contributions from established researchers, PhD candidates, and even passionate citizen scientists. Use our &quot;Write&quot; page to submit your work. All submissions are reviewed for scientific accuracy before publication. Non-peer-reviewed content is clearly labeled as &quot;Community Contributed.&quot;
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-4">
            <AccordionTrigger>Is all content free to access?</AccordionTrigger>
            <AccordionContent>
              <strong>100% of our content is free and open-access.</strong> We believe that climate knowledge is a public good. There are no paywalls, no subscriptions, and no hidden fees. Our platform is funded through grants, donations, and partnerships with environmental organizations.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-5">
            <AccordionTrigger>Who funds the Global Climate Institute?</AccordionTrigger>
            <AccordionContent>
              We are an independent non-profit organization funded by a diverse mix of sources: foundation grants (including the ClimateWorks Foundation and Bloomberg Philanthropies), individual donations, and partnerships with universities and environmental NGOs. We maintain strict editorial independence from all funders.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-6">
            <AccordionTrigger>How can I cite articles from this platform?</AccordionTrigger>
            <AccordionContent>
              Each article includes a citation generator that provides proper academic citations in APA, MLA, Chicago, and BibTeX formats. Simply click the &quot;Cite&quot; button on any article page. Our peer-reviewed articles are also indexed by Google Scholar and CrossRef.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-7">
            <AccordionTrigger>What languages are supported?</AccordionTrigger>
            <AccordionContent>
              Our platform currently supports <strong>English and French</strong>, with translations expanding to Spanish, Mandarin, Arabic, and Portuguese. Many of our most important articles are translated by volunteer linguists to ensure global accessibility.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="item-8">
            <AccordionTrigger>How can I get involved beyond reading?</AccordionTrigger>
            <AccordionContent>
              There are many ways to contribute: <strong>Write articles</strong> to share your research or expertise. <strong>Volunteer as a peer reviewer</strong> if you have scientific credentials. <strong>Translate content</strong> into your native language. <strong>Donate</strong> to support our infrastructure. Or simply <strong>share our articles</strong> on social media to amplify the message.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </div>
);
