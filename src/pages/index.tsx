import LandingLayout from '../components/landing/LandingLayout';
import Hero from '../components/landing/Hero';
import FeatureCards from '../components/landing/FeatureCards';

export default function LandingPage() {
  return (
    <LandingLayout>
      <Hero />
      <FeatureCards />
    </LandingLayout>
  );
}
