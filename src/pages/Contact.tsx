import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { ContactSection } from "@/components/sections/ContactSection";
import { SEOHead } from "@/components/seo/SEOHead";

export default function Contact() {
  return (
    <AmbientSpotlight>
      <SEOHead
        title="Contact Us | IndustryMentor"
        description="Get in touch with the IndustryMentor team for inquiries, course enrollments, or mentor partnerships."
        canonicalUrl="https://industrymentor.net/contact-us"
      />
      <main>
        <ContactSection />
      </main>
    </AmbientSpotlight>
  );
}
