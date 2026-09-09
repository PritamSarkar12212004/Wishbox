import { BrowserRouter, Routes, Route } from 'react-router-dom'

import HomePage from './modules/home/page/HomePage'
import ProductPage from './modules/products/page/ProductPage'
import WishlistPage from './modules/wishlist/page/WishlistPage'
import CartPage from './modules/cart/page/CartPage'
import HistoryPage from './modules/history/page/HistoryPage'
import NotFoundPage from './modules/error/page/NotFoundPage'

import homeConst from './modules/home/consts/homeConst'
import productConst from './modules/products/consts/productConst'
import wishlistConst from './modules/wishlist/consts/wishlistConst'
import cartConst from './modules/cart/consts/cartConst'
import historyConst from './modules/history/consts/historyConst'
import notfoundConst from './modules/error/consts/notfoundConst'

import MainLayout from './layout/MainLayout'
import MainWrapper from './layout/wrapper/MainWrapper'

function App() {
    return (
        <BrowserRouter>
            <MainLayout>
                <Routes>
                    <Route
                        path={homeConst.route.homePage}
                        element={
                            <MainWrapper>
                                <HomePage />
                            </MainWrapper>
                        }
                    />
                    <Route
                        path={productConst.route.productPage}
                        element={
                            <MainWrapper>
                                <ProductPage />
                            </MainWrapper>
                        }
                    />
                    <Route
                        path={wishlistConst.route.wishlistPage}
                        element={
                            <MainWrapper>
                                <WishlistPage />
                            </MainWrapper>
                        }
                    />
                    <Route
                        path={cartConst.route.cartPage}
                        element={
                            <MainWrapper>
                                <CartPage />
                            </MainWrapper>
                        }
                    />
                    <Route
                        path={historyConst.route.historyPage}
                        element={
                            <MainWrapper>
                                <HistoryPage />
                            </MainWrapper>
                        }
                    />
                    <Route
                        path={notfoundConst.route.notfoundPage}
                        element={<NotFoundPage />}
                    />
                </Routes>
            </MainLayout>
        </BrowserRouter>
    )
}

export default App