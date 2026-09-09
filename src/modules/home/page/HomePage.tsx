import Theme from '@/assets/Theme/Theme';
import { Fragment } from 'react';
import ProductHeader from '../components/ProductHeader';
import HeroSection from '../components/HeroSection';
import ProductSections from '../sections/ProductSections';

function HomePage() {
    return (
        <Fragment>
            <ProductHeader />
            <HeroSection />
            <ProductSections />
        </Fragment>
    );
}

export default HomePage;
