import AboutMe from "./AboutMe";
import GamifiedLearning from "./GamifiedLearning";
import HeroSection from "./HeroSection";
import HowStreakUpWorks from "./HowStreakUpWorks";
import LandingBanner from "./LandingBanner";
import LandingFooter from "./LandingFooter";

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <AboutMe />
      <GamifiedLearning />
      <HowStreakUpWorks />
      <LandingBanner />
      <LandingFooter />
    </>
  );
}
