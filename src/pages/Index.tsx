import { AmbientSpotlight } from "@/components/AmbientSpotlight";
import { ContactSection } from "@/components/sections/ContactSection";
import { FeaturedCoursesSection } from "@/components/sections/FeaturedCoursesSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { MentorsSection } from "@/components/sections/MentorsSection";
import { ResourceLibrarySection } from "@/components/sections/ResourceLibrarySection";
import { WhyChooseSection } from "@/components/sections/WhyChooseSection";
import { BlogCTASection } from "@/components/sections/BlogCTASection";

const Index = () => {
  return (
    <AmbientSpotlight>
      <main className="overflow-x-hidden">
        <HeroSection />
        <FeaturedCoursesSection />
        <ResourceLibrarySection />
        <MentorsSection />
        <WhyChooseSection />
        <BlogCTASection />
        <ContactSection />
      </main>
    </AmbientSpotlight>
  );
};

export default Index;

