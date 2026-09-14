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
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          name: "Contact Us — IndustryMentor",
          url: "https://industrymentor.net/contact-us",
          mainEntity: {
            "@type": "EducationalOrganization",
            name: "IndustryMentor",
            url: "https://industrymentor.net",
            telephone: "+8801912895591",
            email: "hi@industrymentor.com",
            address: {
              "@type": "PostalAddress",
              streetAddress: "25/2, Salimuddin Market Road, Mirpur-1",
              addressLocality: "Dhaka",
              addressCountry: "Bangladesh",
            },
          },
        }}
      />
      <main>
        <ContactSection />
      </main>
    </AmbientSpotlight>
  );
}
