import Contact from "@/features/landing-page/contact-us/components/Contact";
import Faqs from "@/features/landing-page/faqs/components/Faqs";
import FeaturesPage from "@/features/landing-page/features-page/components/FeaturesPage";
import Footer from "@/features/landing-page/Footer/components/Footer";
import HeroSection from "@/features/landing-page/hero-section/components/HeroSection";
import LogoCloud from "@/features/landing-page/logo-cloud/components/LogoCloud";
import { Navbar } from "@/features/landing-page/navbar/components/Navbar";
import Pricing from "@/features/landing-page/pricing/components/Pricing";
import { Poppins } from "next/font/google";
const poppins = Poppins({
  weight: ["300", "400", "500", "700"],
  style: ["normal"],
  subsets: ["latin"],
});
export default function Home() {
  return (
    <>
      <Navbar />
      <div className={poppins.className}>
        <HeroSection />
        <LogoCloud />
        <FeaturesPage />
        <Pricing />
        <Faqs />
        <Footer />
      </div>
    </>
  );
}
