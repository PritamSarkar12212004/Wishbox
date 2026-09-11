import { Fragment } from 'react';
import HeroSection from '../components/HeroSection';
import ProductSections from '../sections/ProductSections';

function HomePage() {
    return (
        <Fragment>
            <HeroSection />
            <ProductSections />
        </Fragment>
    );
}

export default HomePage;
