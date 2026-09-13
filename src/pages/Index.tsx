import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { SEOHead } from "@/components/seo/SEOHead";
import { HeroSection } from "@/components/sections/HeroSection";
import { TrustStripSection } from "@/components/sections/TrustStripSection";
import { CareerPathwaySection } from "@/components/sections/CareerPathwaySection";
import { FeaturedCoursesSection } from "@/components/sections/FeaturedCoursesSection";
import { MentorsSection } from "@/components/sections/MentorsSection";
import { ProjectsTeaserSection } from "@/components/sections/ProjectsTeaserSection";
import { ResourceLibrarySection } from "@/components/sections/ResourceLibrarySection";
import { WhyChooseSection } from "@/components/sections/WhyChooseSection";
import { BlogCTASection } from "@/components/sections/BlogCTASection";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { ContactSection } from "@/components/sections/ContactSection";

const Index = () => {
  return (
    <AmbientSpotlight>
      <SEOHead
        title="IndustryMentor — Bridge Education & Real-World Industry Knowledge"
        description="Empowering emerging professionals with practitioner-led training, 1:1 expert mentorship, production-ready resources, and verified credentials in Garment Merchandising and Industrial Engineering."
        canonicalUrl="https://industrymentor.net/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "EducationalOrganization",
          name: "IndustryMentor",
          url: "https://industrymentor.net",
          logo: "https://industrymentor.net/logo.png",
          description:
            "Empowering emerging professionals with practitioner-led training, 1:1 expert mentorship, production-ready resources, and verified credentials in Garment Merchandising and Industrial Engineering.",
          sameAs: ["https://www.linkedin.com/company/industrymentor"],
        }}
      />
      <main className="overflow-x-hidden">
        <HeroSection />
        <TrustStripSection />
        <CareerPathwaySection />
        <FeaturedCoursesSection />
        <MentorsSection />
        <ProjectsTeaserSection />
        <ResourceLibrarySection />
        <WhyChooseSection />
        <BlogCTASection />
        <FinalCTASection />
        <ContactSection />
      </main>
    </AmbientSpotlight>
  );
};

export default Index;

